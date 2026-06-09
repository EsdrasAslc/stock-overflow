package com.stockoverflow.estoque_api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Slf4j
public class ApiLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        long startTime = System.currentTimeMillis();
        
        log.info(">>> API REQUEST: [{}] {}", request.getMethod(), request.getRequestURI());
        
        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            int status = response.getStatus();
            
            if (status >= 200 && status < 300) {
                log.info("<<< SUCESSO: [{}] {} | Status: {} | Tempo: {}ms", request.getMethod(), request.getRequestURI(), status, duration);
            } else if (status >= 400 && status < 500) {
                log.warn("<<< AVISO (Erro de Cliente): [{}] {} | Status: {} | Tempo: {}ms", request.getMethod(), request.getRequestURI(), status, duration);
            } else {
                log.error("<<< ERRO (Servidor/Exceção): [{}] {} | Status: {} | Tempo: {}ms", request.getMethod(), request.getRequestURI(), status, duration);
            }
        }
    }
}
