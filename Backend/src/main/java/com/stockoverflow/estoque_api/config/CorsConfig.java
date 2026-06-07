package com.stockoverflow.estoque_api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuração global de CORS para permitir requisições vindas do frontend React.
 */
@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // Habilita CORS para todos os endpoints da API
                registry.addMapping("/**")
                        // Permite origens locais comuns para desenvolvimento do frontend (Vite, React)
                        .allowedOrigins("http://localhost:5173", "http://localhost:3000")
                        // Permite todos os métodos HTTP comuns
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                        // Permite qualquer cabeçalho na requisição
                        .allowedHeaders("*")
                        // Habilita envio de cookies de credenciais e sessões
                        .allowCredentials(true);
            }
        };
    }
}
