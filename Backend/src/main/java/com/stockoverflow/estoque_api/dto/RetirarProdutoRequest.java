package com.stockoverflow.estoque_api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * DTO para solicitação de retirada de um produto.
 * Permite buscar por produtoId (ID exato) ou nome.
 */
public record RetirarProdutoRequest(
    String produtoId,
    
    String nome,

    @NotNull(message = "A quantidade é obrigatória")
    @Positive(message = "A quantidade deve ser maior que zero")
    Integer quantidade
) {}
