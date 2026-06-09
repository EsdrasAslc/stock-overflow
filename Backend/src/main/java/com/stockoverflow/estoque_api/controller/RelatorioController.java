package com.stockoverflow.estoque_api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/relatorios")
public class RelatorioController {

    @GetMapping("/movimentacoes")
    public List<Map<String, Object>> getMovimentacoes() {
        return List.of(
            Map.of("id", 1, "date", "2026-06-08 10:00", "operator", "Sistema", "action", "Entrada", "product", "ESP32", "code", "HW-001", "position", "1A1", "qty", 10, "status", "SUCESSO")
        );
    }

    @GetMapping("/falhas")
    public List<Map<String, Object>> getFalhas() {
        return List.of(
            Map.of("id", 1, "timestamp", "2026-06-08 10:05", "type", "Sensor", "description", "Erro no sensor ultrassônico", "position", "1A1", "operator", "Sistema", "resolved", false)
        );
    }
}
