package com.stockoverflow.estoque_api.controller;

import com.stockoverflow.estoque_api.dto.LogResponseDTO;
import com.stockoverflow.estoque_api.service.LogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class LogController {

    private final LogService service;

    @GetMapping
    public List<LogResponseDTO> listarTodos() {
        return service.listarTodos();
    }

    @GetMapping("/ultimo")
    public LogResponseDTO buscarUltimoLog() {
        return service.buscarUltimoLog();
    }
}
