package com.stockoverflow.estoque_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ProdutoSaidaDTO(
    @NotBlank(message = "O produto é obrigatório")
    String produto,

    @NotNull(message = "A quantidade é obrigatória")
    @Positive(message = "A quantidade deve ser maior que zero")
    Integer quantidade,

    String motivo,

    @NotBlank(message = "A estante é obrigatória")
    String estanteId,

    @NotNull(message = "A coordenada X é obrigatória")
    Integer x,

    @NotNull(message = "A coordenada Y é obrigatória")
    Integer y
) {}
