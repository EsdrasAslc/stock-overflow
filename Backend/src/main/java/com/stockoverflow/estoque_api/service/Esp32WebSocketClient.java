package com.stockoverflow.estoque_api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockoverflow.estoque_api.config.Esp32WebSocketConfig;
import com.stockoverflow.estoque_api.config.FrontendWebSocketHandler;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.*;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.concurrent.*;

/**
 * Cliente WebSocket persistente que se conecta com o ESP32 (robô físico).
 * Adaptado para se comunicar usando o protocolo padrão do firmware do ESP32 (sem requestId).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class Esp32WebSocketClient extends TextWebSocketHandler {

    private final WebSocketClient webSocketClient;
    private final Esp32WebSocketConfig config;
    private final FrontendWebSocketHandler frontendWebSocketHandler;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private WebSocketSession session;
    
    // Como o robô executa um comando por vez, usamos um único futuro ativo e sincronizado
    private CompletableFuture<String> activeFuture;

    // Futuro para rastrear a finalização física da movimentação do robô
    private CompletableFuture<Void> completionFuture;

    public synchronized CompletableFuture<Void> prepareCompletionFuture() {
        this.completionFuture = new CompletableFuture<>();
        return this.completionFuture;
    }

    @PostConstruct
    public void connect() {
        try {
            webSocketClient.execute(this, config.getEsp32WsUrl()).get(5, TimeUnit.SECONDS);
            log.info("[ESP32] Conexão WebSocket estabelecida com sucesso: {}", config.getEsp32WsUrl());
        } catch (Exception e) {
            log.warn("[ESP32] Não foi possível conectar ao ESP32 na inicialização: {}", e.getMessage());
        }
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        this.session = session;
        log.info("[ESP32] Sessão WebSocket activa com ID: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        log.debug("[ESP32] Mensagem recebida: {}", payload);

        try {
            JsonNode json = objectMapper.readTree(payload);
            String status = json.path("status").asText();

            // Mensagens de telemetria/broadcasts contínuos são apenas logadas
            if ("movendo".equals(status) || "retornando".equals(status) || "finalizado".equals(status)) {
                log.info("[ESP32] Telemetria: {}", payload);
                frontendWebSocketHandler.broadcast(payload); // Repassa a telemetria ao Frontend
                if ("finalizado".equals(status)) {
                    synchronized (this) {
                        if (this.completionFuture != null && !this.completionFuture.isDone()) {
                            this.completionFuture.complete(null);
                            this.completionFuture = null;
                        }
                    }
                }
                return;
            }

            // Se for uma resposta direta de comando (aceito, parado, info, erro), resolvemos o futuro ativo
            CompletableFuture<String> future = this.activeFuture;
            if (future != null && !future.isDone()) {
                future.complete(payload);
            }

            if ("parado".equals(status)) {
                synchronized (this) {
                    if (this.completionFuture != null && !this.completionFuture.isDone()) {
                        this.completionFuture.completeExceptionally(new RuntimeException("Movimentação cancelada por comando de parada"));
                        this.completionFuture = null;
                    }
                }
            }
        } catch (Exception e) {
            log.error("[ESP32] Erro ao processar o JSON da mensagem recebida: {}", e.getMessage());
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("[ESP32] Erro de transporte detectado no WebSocket: {}", exception.getMessage());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.warn("[ESP32] Conexão encerrada: {}. Tentando reconectar...", status);
        this.session = null;
        synchronized (this) {
            if (this.completionFuture != null && !this.completionFuture.isDone()) {
                this.completionFuture.completeExceptionally(new RuntimeException("Conexão WebSocket com o ESP32 foi perdida"));
                this.completionFuture = null;
            }
        }
        scheduleReconnect();
    }

    private void scheduleReconnect() {
        CompletableFuture.delayedExecutor(5, TimeUnit.SECONDS).execute(this::connect);
    }

    /**
     * Envia um comando JSON para o ESP32 de forma síncrona.
     * Marcado como synchronized para evitar que múltiplos threads tentem usar o futuro ativo ao mesmo tempo.
     */
    public synchronized String sendAndWait(String jsonPayload) throws Exception {
        if (session == null || !session.isOpen()) {
            throw new IllegalStateException("ESP32 não está conectado");
        }

        CompletableFuture<String> future = new CompletableFuture<>();
        this.activeFuture = future;

        try {
            session.sendMessage(new TextMessage(jsonPayload));
            // Aguarda o ESP32 responder com o status direto da ação
            return future.get(config.getTimeoutSeconds(), TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            throw new TimeoutException("ESP32 não respondeu em " + config.getTimeoutSeconds() + "s");
        } finally {
            if (this.activeFuture == future) {
                this.activeFuture = null;
            }
        }
    }

    public boolean isConnected() {
        return session != null && session.isOpen();
    }
}
