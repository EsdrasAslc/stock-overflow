package com.stockoverflow.estoque_api.dto;

import com.stockoverflow.estoque_api.model.UsuarioRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UsuarioRequestDTO(
        @NotBlank(message = "O nome não pode estar em branco") String nome,

        @NotBlank(message = "O cpf não pode estar em branco") String cpf,

        @NotBlank(message = "A senha não pode estar em branco") @Size(min = 6, message = "A senha deve ter pelo menos 6 caracteres") String password,

        @NotNull(message = "O cargo (role) é obrigatório") UsuarioRole role) {
}
