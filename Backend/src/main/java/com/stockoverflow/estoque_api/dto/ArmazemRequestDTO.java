package com.stockoverflow.estoque_api.dto;

import jakarta.validation.constraints.NotBlank;

public record ArmazemRequestDTO(
    @NotBlank(message = "O nome não pode estar em branco")
    String nome
) {}
