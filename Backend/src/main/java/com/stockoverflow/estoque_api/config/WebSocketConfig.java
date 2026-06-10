package com.stockoverflow.estoque_api.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * Configuração do Servidor WebSocket para o Frontend.
 */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final FrontendWebSocketHandler frontendWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Registra o endpoint /ws/telemetry aceitando conexões de qualquer origem (CORS)
        registry.addHandler(frontendWebSocketHandler, "/ws/telemetry").setAllowedOrigins("*");
    }
}
