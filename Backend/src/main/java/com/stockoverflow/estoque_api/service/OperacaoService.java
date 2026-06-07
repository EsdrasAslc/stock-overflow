package com.stockoverflow.estoque_api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockoverflow.estoque_api.dto.GuardarProdutoRequest;
import com.stockoverflow.estoque_api.dto.RetirarProdutoRequest;
import com.stockoverflow.estoque_api.dto.OperacaoResponse;
import com.stockoverflow.estoque_api.model.*;
import com.stockoverflow.estoque_api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Serviço responsável pela lógica transacional das operações físicas e digitais de estoque.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OperacaoService {

    private final Esp32WebSocketClient esp32Client;
    private final EstanteRepository estanteRepository;
    private final ProdutoRepository produtoRepository;
    private final LogRepository logRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Guarda um produto na estante que tiver espaço vago disponível.
     */
    @Transactional
    public OperacaoResponse guardar(GuardarProdutoRequest request) {
        log.info("[OPERACAO] Iniciando armazenamento do produto: {} (Quantidade: {})", request.nome(), request.quantidade());

        // 1. Busca estante com espaço disponível
        Estante estante = estanteRepository.findAll().stream()
                .filter(e -> e.getCapacidadeAtual() + request.quantidade() <= e.getCapacidadeMaxima())
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Não há estantes com capacidade disponível para a quantidade solicitada"));

        // 2. Extrai coordenadas da estante (A3 -> x: 100, y: 30)
        Map<String, Integer> coords = extrairCoordenadas(estante);
        int x = coords.get("x");
        int y = coords.get("y");

        // 3. Envia o comando via WebSocket e aguarda a finalização física do robô
        enviarAcaoEaguardar(x, y);

        // 4. Salva ou atualiza o produto no banco
        Produto produto = produtoRepository.findByEstanteId(estante.getId()).stream()
                .filter(p -> p.getNome().equalsIgnoreCase(request.nome()))
                .findFirst()
                .orElse(null);

        if (produto != null) {
            produto.setQuantidade(produto.getQuantidade() + request.quantidade());
            produtoRepository.save(produto);
        } else {
            produto = Produto.builder()
                    .nome(request.nome())
                    .quantidade(request.quantidade())
                    .estante(estante)
                    .build();
            produtoRepository.save(produto);
        }

        // 5. Atualiza capacidade da estante
        estante.setCapacidadeAtual(estante.getCapacidadeAtual() + request.quantidade());
        estanteRepository.save(estante);

        // 6. Cria log de movimentação
        Log logObj = Log.builder()
                .timestamp(LocalDateTime.now())
                .tipo(TipoLog.LOGISTICA)
                .mensagem(String.format("Produto '%s' (Qtd: %d) guardado com sucesso na Estante '%s' nas coordenadas X:%d, Y:%d", 
                        request.nome(), request.quantidade(), estante.getNome(), x, y))
                .estante(estante)
                .build();
        logRepository.save(logObj);

        log.info("[OPERACAO] Produto '{}' guardado com sucesso na base de dados.", request.nome());
        return new OperacaoResponse("sucesso", "Produto guardado com sucesso", x, y, "guardar");
    }

    /**
     * Retira um produto de sua estante.
     */
    @Transactional
    public OperacaoResponse retirar(RetirarProdutoRequest request) {
        log.info("[OPERACAO] Iniciando retirada de produto. ID: {}, Nome: {}, Quantidade: {}", 
                request.produtoId(), request.nome(), request.quantidade());

        Produto produto;
        if (request.produtoId() != null && !request.produtoId().isBlank()) {
            produto = produtoRepository.findById(request.produtoId())
                    .orElseThrow(() -> new RuntimeException("Produto não encontrado por ID"));
        } else if (request.nome() != null && !request.nome().isBlank()) {
            produto = produtoRepository.findAll().stream()
                    .filter(p -> p.getNome().equalsIgnoreCase(request.nome()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Produto não encontrado por nome: " + request.nome()));
        } else {
            throw new IllegalArgumentException("É necessário informar o ID ou o nome do produto a ser retirado");
        }

        if (produto.getQuantidade() < request.quantidade()) {
            throw new RuntimeException("Quantidade solicitada maior do que a disponível em estoque (" + produto.getQuantidade() + ")");
        }

        Estante estante = produto.getEstante();
        if (estante == null) {
            throw new RuntimeException("Produto não está associado a nenhuma estante");
        }

        // Extrai coordenadas da estante
        Map<String, Integer> coords = extrairCoordenadas(estante);
        int x = coords.get("x");
        int y = coords.get("y");

        // Envia o comando via WebSocket e aguarda a finalização física do robô
        enviarAcaoEaguardar(x, y);

        // Atualiza a quantidade do produto ou remove se zerado
        if (produto.getQuantidade().equals(request.quantidade())) {
            produtoRepository.delete(produto);
        } else {
            produto.setQuantidade(produto.getQuantidade() - request.quantidade());
            produtoRepository.save(produto);
        }

        // Atualiza capacidade da estante
        estante.setCapacidadeAtual(Math.max(0, estante.getCapacidadeAtual() - request.quantidade()));
        estanteRepository.save(estante);

        // Cria log de movimentação
        Log logObj = Log.builder()
                .timestamp(LocalDateTime.now())
                .tipo(TipoLog.LOGISTICA)
                .mensagem(String.format("Produto '%s' (Qtd: %d) retirado com sucesso da Estante '%s' nas coordenadas X:%d, Y:%d", 
                        produto.getNome(), request.quantidade(), estante.getNome(), x, y))
                .estante(estante)
                .build();
        logRepository.save(logObj);

        log.info("[OPERACAO] Produto '{}' retirado com sucesso da base de dados.", produto.getNome());
        return new OperacaoResponse("sucesso", "Produto retirado com sucesso", x, y, "retirar");
    }

    /**
     * Envia o comando de parada imediata ao robô.
     */
    public void pararRobo() {
        Map<String, Object> payload = Map.of("action", "stop");
        try {
            String payloadJson = objectMapper.writeValueAsString(payload);
            log.info("[OPERACAO] Enviando parada de emergência para ESP32: {}", payloadJson);
            esp32Client.sendAndWait(payloadJson);
        } catch (Exception e) {
            log.error("[OPERACAO] Erro ao enviar comando de parada: {}", e.getMessage());
            throw new RuntimeException("Erro ao comunicar parada de emergência: " + e.getMessage());
        }
    }

    /**
     * Coordena o envio do JSON de movimento ao ESP32 e bloqueia a thread aguardando a telemetria "finalizado".
     */
    private void enviarAcaoEaguardar(int x, int y) {
        Map<String, Object> payload = Map.of(
                "action", "move",
                "x", x,
                "y", y
        );
        try {
            String payloadJson = objectMapper.writeValueAsString(payload);
            log.info("[OPERACAO] Enviando comando de movimento para ESP32: {}", payloadJson);

            // Prepara o futuro para aguardar a finalização física (telemetria "finalizado" ou falha em "parado")
            CompletableFuture<Void> completionFuture = esp32Client.prepareCompletionFuture();

            // Envia e aguarda o aceite inicial
            String rawResponse = esp32Client.sendAndWait(payloadJson);
            Map<?, ?> responseMap = objectMapper.readValue(rawResponse, Map.class);
            Object statusObj = responseMap.get("status");

            if (statusObj != null && "erro".equalsIgnoreCase(statusObj.toString())) {
                throw new RuntimeException("ESP32 rejeitou o comando: " + responseMap.get("mensagem"));
            }

            log.info("[OPERACAO] Comando aceito pelo ESP32. Aguardando conclusão física do trajeto...");
            // Aguarda a notificação de finalização física (timeout de 60 segundos)
            completionFuture.get(60, TimeUnit.SECONDS);
            log.info("[OPERACAO] Movimentação concluída física e com sucesso!");

        } catch (TimeoutException e) {
            log.error("[OPERACAO] Tempo limite (60s) esgotado aguardando o fim da movimentação do robô.");
            throw new RuntimeException("Tempo esgotado aguardando conclusão física do robô");
        } catch (Exception e) {
            log.error("[OPERACAO] Falha durante a execução física do robô: {}", e.getMessage());
            throw new RuntimeException("Falha na movimentação do robô: " + e.getMessage());
        }
    }

    /**
     * Obtém as coordenadas X e Y diretamente da Estante física.
     */
    private Map<String, Integer> extrairCoordenadas(Estante estante) {
        return Map.of(
                "x", estante.getX() != null ? estante.getX() : 100,
                "y", estante.getY() != null ? estante.getY() : 30
        );
    }
}
