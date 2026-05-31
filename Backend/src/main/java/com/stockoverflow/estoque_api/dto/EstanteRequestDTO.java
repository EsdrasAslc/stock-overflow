package com.stockoverflow.estoque_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record EstanteRequestDTO(
    @NotBlank(message = "O nome não pode estar em branco")
    String nome,

    @NotNull(message = "A capacidade máxima é obrigatória")
    @Positive(message = "A capacidade máxima deve ser positiva")
    Integer capacidadeMaxima,

    @NotBlank(message = "O ID do armazém é obrigatório")
    String armazemId
) {}
