package com.stockoverflow.estoque_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ProdutoEntradaDTO(
    @NotBlank(message = "O produto é obrigatório")
    String produto,

    @NotNull(message = "A quantidade é obrigatória")
    @Positive(message = "A quantidade deve ser maior que zero")
    Integer quantidade,

    @NotBlank(message = "A posição é obrigatória")
    String posicao,

    String fornecedor,
    String nf,
    String nome,
    String categoria,
    String dataValidade
) {}
