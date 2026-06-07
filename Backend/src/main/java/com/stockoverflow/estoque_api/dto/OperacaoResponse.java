package com.stockoverflow.estoque_api.dto;

/**
 * DTO para resposta de operações físicas/transacionais de estoque.
 */
public record OperacaoResponse(
    String status,
    String mensagem,
    Integer x,
    Integer y,
    String tipo
) {}
