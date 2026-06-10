package com.stockoverflow.estoque_api.dto;

import java.util.List;

public record DashboardMetricsDTO(
    KpisDTO kpis,
    List<CategoryItemDTO> categorias,
    StorageDTO armazenamento,
    List<TopProductDTO> topProducts,
    List<LogItemDTO> logs
) {
    public record KpisDTO(int produtosCadastrados, String slotsOcupados, int vencem30Dias, int lotesVencidos) {}
    public record CategoryItemDTO(String label, int value, String color) {}
    public record StorageDTO(int occupied, int free, int pct) {}
    public record TopProductDTO(String name, int qty) {}
    public record LogItemDTO(String id, String operator, String action, String product, String position, String status, String time) {}
}
