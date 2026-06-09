package com.stockoverflow.estoque_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record ProdutoRequestDTO(
    @NotBlank(message = "O código é obrigatório")
    String codigo,

    @NotBlank(message = "O nome não pode estar em branco")
    String nome,

    String categoria,

    @NotNull(message = "A quantidade é obrigatória")
    @PositiveOrZero(message = "A quantidade não pode ser negativa")
    Integer quantidade,

    String dataEntrada,
    String dataValidade,

    @NotBlank(message = "O ID da estante é obrigatório")
    String estanteId
) {}
