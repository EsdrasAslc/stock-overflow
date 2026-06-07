package com.stockoverflow.estoque_api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockoverflow.estoque_api.dto.RobotCommandRequest;
import com.stockoverflow.estoque_api.dto.RobotCommandResponse;
import com.stockoverflow.estoque_api.model.Robot;
import com.stockoverflow.estoque_api.repository.RobotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeoutException;

/**
 * Serviço responsável por orquestrar a lógica de negócio do comando.
 * Ele recebe a requisição REST, valida o robô, formata o JSON do ESP32,
 * aciona a comunicação e devolve a resposta final traduzida.
 */
@Slf4j // Habilita logging no console
@Service // Declara a classe como um serviço do Spring
@RequiredArgsConstructor // Construtor automático com campos final
public class RobotCommandService {

    private final Esp32WebSocketClient esp32Client; // Injeta o cliente de WebSocket
    private final RobotRepository robotRepository; // Injeta o repositório de acesso a dados da entidade Robot
    private final ObjectMapper objectMapper = new ObjectMapper(); // Jackson Mapper para serialização/deserialização

    /**
     * Envia um comando customizado para um robô registrado.
     * 
     * @param robotId Identificador textual do robô (ex: "ROB-01")
     * @param request Payload contendo o comando e parâmetros (estante, produto)
     * @return DTO com o resultado retornado pelo robô ou erro tratado
     */
    public RobotCommandResponse sendCommand(String robotId, RobotCommandRequest request) {
        // 1. Busca e valida se o robô realmente existe no banco de dados
        Robot robot = robotRepository.findById(robotId)
                .orElseThrow(() -> new RuntimeException("Robô não encontrado: " + robotId));

        // 2. Gera um identificador único exclusivo da requisição para rastreamento (requestId)
        String requestId = UUID.randomUUID().toString();

        // 3. Constrói o mapa de dados a ser enviado para o robô físico no formato que ele espera
        Map<String, Object> payload = Map.of(
                "requestId", requestId,
                "robotId", robotId,
                "command", request.getCommand(),
                "targetShelf", request.getTargetShelf() != null ? request.getTargetShelf() : "",
                "productId", request.getProductId() != null ? request.getProductId() : ""
        );

        try {
            // 4. Converte o mapa Java em uma String JSON estruturada
            String payloadJson = objectMapper.writeValueAsString(payload);
            log.info("[CMD] Enviando comando '{}' para robô {}", request.getCommand(), robotId);

            // 5. Envia o JSON via WebSocket e bloqueia a linha de execução aguardando a resposta textual
            String rawResponse = esp32Client.sendAndWait(requestId, payloadJson);
            
            // 6. Faz o parsing do JSON recebido do ESP32 de volta para um mapa Java genérico
            Map<?, ?> responseMap = objectMapper.readValue(rawResponse, Map.class);
            Object statusObj = responseMap.get("status");
            Object messageObj = responseMap.get("message");

            // 7. Retorna a resposta empacotada no DTO de resposta do robô
            return new RobotCommandResponse(
                    requestId,
                    statusObj != null ? statusObj.toString() : "OK",
                    messageObj != null ? messageObj.toString() : "Comando executado",
                    responseMap.get("data")
            );

        } catch (TimeoutException e) {
            // Se o ESP32 estourar o tempo limite configurado no .env sem responder
            log.error("[CMD] Timeout aguardando resposta do ESP32 para requestId={}", requestId);
            throw new RuntimeException("ESP32 não respondeu no tempo esperado");
        } catch (IllegalStateException e) {
            // Se tentar enviar o comando e o canal WebSocket com o ESP32 estiver offline
            log.error("[CMD] ESP32 desconectado");
            throw new RuntimeException("Robô não está conectado");
        } catch (Exception e) {
            // Caso ocorra qualquer falha inesperada na codificação de JSON ou socket
            log.error("[CMD] Erro ao enviar comando: {}", e.getMessage());
            throw new RuntimeException("Erro interno ao comunicar com o robô");
        }
    }

    /**
     * Verifica com o cliente WebSocket se a conexão física está ativa.
     */
    public boolean isRobotConnected() {
        return esp32Client.isConnected();
    }
}
