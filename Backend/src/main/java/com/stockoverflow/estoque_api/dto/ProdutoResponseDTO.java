package com.stockoverflow.estoque_api.dto;

public record ProdutoResponseDTO(
    String id,
    String nome,
    Integer quantidade,
    String estanteId
) {}
