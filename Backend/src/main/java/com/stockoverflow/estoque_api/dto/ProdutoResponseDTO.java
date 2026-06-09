package com.stockoverflow.estoque_api.dto;

public record ProdutoResponseDTO(
    String id,
    String code,
    String name,
    String category,
    String position,
    String entryDate,
    String valDate,
    Integer qty
) {}
