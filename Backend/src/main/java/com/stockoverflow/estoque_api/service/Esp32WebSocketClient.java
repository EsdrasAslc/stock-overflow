package com.stockoverflow.estoque_api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockoverflow.estoque_api.config.Esp32WebSocketConfig;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.*;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.concurrent.*;

/**
 * Cliente WebSocket persistente que se conecta com o ESP32 (robô físico).
 * Estende TextWebSocketHandler para interceptar eventos de conexão, desconexão e recepção de mensagens de texto.
 */
@Slf4j // Habilita o logger do Lombok (log.info, log.error, etc)
@Service // Registra a classe como um serviço gerenciado pelo Spring (Singleton)
@RequiredArgsConstructor // Cria um construtor com os atributos finais (final) automaticamente via Lombok
public class Esp32WebSocketClient extends TextWebSocketHandler {

    private final WebSocketClient webSocketClient; // Cliente WebSocket injetado via construtor
    private final Esp32WebSocketConfig config; // Classe com as propriedades de timeout e URL
    private final ObjectMapper objectMapper = new ObjectMapper(); // Jackson Mapper para serializar/deserializar JSON

    private WebSocketSession session; // Armazena a sessão ativa da conexão física com o ESP32
    
    // Mapa concorrente para rastrear solicitações síncronas pendentes de resposta do ESP32.
    // Chave: requestId (UUID) -> Valor: Futuro contendo a resposta textual que será resolvida quando o robô responder
    private final Map<String, CompletableFuture<String>> pending = new ConcurrentHashMap<>();

    /**
     * Tenta se conectar ao ESP32 imediatamente após a inicialização da classe pelo Spring.
     */
    @PostConstruct // Faz o Spring rodar esse método automaticamente logo após a injeção de dependências
    public void connect() {
        try {
            // Executa a conexão física de forma assíncrona, definindo o tempo limite de conexão inicial como 5 segundos
            webSocketClient.execute(this, config.getEsp32WsUrl()).get(5, TimeUnit.SECONDS);
            log.info("[ESP32] Conexão WebSocket estabelecida com sucesso: {}", config.getEsp32WsUrl());
        } catch (Exception e) {
            // Caso falhe (robô desligado ou IP incorreto), loga um aviso e não quebra a inicialização do Spring
            log.warn("[ESP32] Não foi possível conectar ao ESP32 na inicialização: {}", e.getMessage());
        }
    }

    /**
     * Chamado automaticamente pelo Spring quando a conexão física WebSocket com o ESP32 é ativada.
     */
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        this.session = session; // Guarda a sessão ativa para envio de futuras mensagens
        log.info("[ESP32] Sessão WebSocket ativa com ID: {}", session.getId());
    }

    /**
     * Chamado automaticamente pelo Spring sempre que o ESP32 enviar uma mensagem de texto pelo canal WebSocket.
     */
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload(); // Obtém o corpo da mensagem (JSON retornado pelo ESP32)
        log.debug("[ESP32] Mensagem recebida: {}", payload);

        try {
            // Analisa a string JSON para ler suas propriedades
            JsonNode json = objectMapper.readTree(payload);
            String requestId = json.path("requestId").asText(); // Extrai o requestId da resposta

            // Remove e resgata a promessa (Future) associada a este requestId do mapa pending
            CompletableFuture<String> future = pending.remove(requestId);
            if (future != null) {
                // Se a promessa existir, "resolve" ela passando o payload recebido.
                // Isso libera imediatamente a thread que estava travada no método sendAndWait() esperando a resposta.
                future.complete(payload);
            } else {
                log.warn("[ESP32] Resposta recebida do robô sem requestId correspondente no mapa: {}", requestId);
            }
        } catch (Exception e) {
            log.error("[ESP32] Erro ao processar o JSON da mensagem recebida: {}", e.getMessage());
        }
    }

    /**
     * Chamado automaticamente se ocorrer algum erro na transmissão/transporte de dados na conexão física.
     */
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("[ESP32] Erro de transporte detectado no WebSocket: {}", exception.getMessage());
    }

    /**
     * Chamado automaticamente quando a conexão WebSocket com o ESP32 é fechada (seja por queda física de rede ou reinício).
     */
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.warn("[ESP32] Conexão encerrada: {}. Tentando reconectar...", status);
        this.session = null; // Limpa a referência da sessão antiga
        scheduleReconnect(); // Agenda a próxima tentativa de conexão
    }

    /**
     * Agenda uma tentativa de reconexão executada em uma thread separada após 5 segundos.
     */
    private void scheduleReconnect() {
        CompletableFuture.delayedExecutor(5, TimeUnit.SECONDS).execute(this::connect);
    }

    /**
     * Envia um payload JSON ao ESP32 e bloqueia de forma síncrona a thread de execução do Java
     * até que o ESP32 responda com o mesmo requestId ou estoure o tempo limite de Timeout.
     * 
     * @param requestId Identificador exclusivo da transação (UUID)
     * @param jsonPayload Mensagem de comando serializada em JSON
     * @return A resposta textual (JSON) do ESP32 correspondente ao requestId
     */
    public String sendAndWait(String requestId, String jsonPayload) throws Exception {
        // Valida se há conexão ativa com o ESP32 antes de tentar enviar
        if (session == null || !session.isOpen()) {
            throw new IllegalStateException("ESP32 não está conectado");
        }

        CompletableFuture<String> future = new CompletableFuture<>(); // Cria a promessa de resposta
        pending.put(requestId, future); // Adiciona no mapa de rastreamento de transações ativas

        try {
            // Envia a mensagem de texto de fato pelo socket
            session.sendMessage(new TextMessage(jsonPayload));
            
            // Aguarda síncronamente pela resolução da promessa pelo tempo definido nas configurações
            return future.get(config.getTimeoutSeconds(), TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            // Se estourar o tempo de espera do robô, remove do mapa pendente para evitar vazamento de memória e lança erro
            pending.remove(requestId);
            throw new TimeoutException("ESP32 não respondeu em " + config.getTimeoutSeconds() + "s");
        } catch (Exception e) {
            // Caso ocorra qualquer outra falha (ex: quebra de canal), limpa o mapa e propaga o erro
            pending.remove(requestId);
            throw e;
        }
    }

    /**
     * Método público utilitário para checar a saúde da conexão do WebSocket com o robô.
     * 
     * @return true se o robô estiver ativamente conectado e pronto para receber comandos
     */
    public boolean isConnected() {
        return session != null && session.isOpen();
    }
}
