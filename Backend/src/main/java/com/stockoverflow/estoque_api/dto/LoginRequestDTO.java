package com.stockoverflow.estoque_api.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequestDTO(
        @NotBlank(message = "O usuário não pode estar em branco") String user,
        @NotBlank(message = "A senha não pode estar em branco") String password) {
}
