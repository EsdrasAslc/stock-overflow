package com.stockoverflow.estoque_api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;

/**
 * Classe de configuração do Spring para centralizar os parâmetros
 * de comunicação via WebSocket com o microcontrolador ESP32.
 */
@Configuration // Indica ao Spring que esta é uma classe de definição de configurações/beans
public class Esp32WebSocketConfig {

    // Injeta o valor da URL do WebSocket definida no application.properties (que vem do arquivo .env)
    @Value("${esp32.ws.url}")
    private String esp32WsUrl;

    // Injeta o timeout limite em segundos. Caso não esteja definido, o valor padrão adotado será 5
    @Value("${esp32.timeout.seconds:5}")
    private int timeoutSeconds;

    /**
     * Declara um Bean do tipo WebSocketClient. 
     * O Spring Boot usará esta instância padrão (StandardWebSocketClient) para
     * iniciar conexões físicas de cliente WebSocket.
     */
    @Bean
    public WebSocketClient webSocketClient() {
        return new StandardWebSocketClient();
    }

    // Método getter para expor a URL de conexão do ESP32 para os outros serviços
    public String getEsp32WsUrl() { 
        return esp32WsUrl; 
    }
    
    // Método getter para expor o tempo limite de espera (Timeout) para os outros serviços
    public int getTimeoutSeconds() { 
        return timeoutSeconds; 
    }
}
