package com.stockoverflow.estoque_api.controller;

import com.stockoverflow.estoque_api.dto.DashboardMetricsDTO;
import com.stockoverflow.estoque_api.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService service;

    @GetMapping("/metrics")
    public DashboardMetricsDTO getMetrics() {
        return service.getMetrics();
    }
}
