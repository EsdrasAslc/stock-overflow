package com.stockoverflow.estoque_api.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Handler WebSocket para gerenciar as conexões vindas do Frontend (React).
 */
@Slf4j
@Component
public class FrontendWebSocketHandler extends TextWebSocketHandler {

    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        log.info("[FRONTEND WS] Cliente conectado: {}", session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        log.info("[FRONTEND WS] Cliente desconectado: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // Por enquanto, o frontend só recebe dados, mas podemos logar se ele enviar algo
        log.info("[FRONTEND WS] Mensagem recebida do frontend: {}", message.getPayload());
    }

    /**
     * Envia uma mensagem em broadcast para todos os clientes Frontend conectados.
     */
    public void broadcast(String message) {
        if (sessions.isEmpty()) {
            return;
        }
        
        TextMessage textMessage = new TextMessage(message);
        for (WebSocketSession session : sessions) {
            try {
                if (session.isOpen()) {
                    session.sendMessage(textMessage);
                }
            } catch (IOException e) {
                log.error("[FRONTEND WS] Erro ao enviar mensagem para o cliente {}: {}", session.getId(), e.getMessage());
            }
        }
    }
}
