package com.stockoverflow.estoque_api.controller;

import com.stockoverflow.estoque_api.dto.LogDTO;
import com.stockoverflow.estoque_api.service.LogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class LogController {

    private final LogService service;

    @GetMapping("/ultimo")
    public LogDTO buscarUltimoLog() {
        return service.buscarUltimoLog();
    }
}
