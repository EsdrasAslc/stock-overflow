package com.stockoverflow.estoque_api.dto;

public record RobotResponseDTO(
    String id,
    String status,
    ProdutoResponseDTO produtoAtual,
    String estanteAtualId
) {}
