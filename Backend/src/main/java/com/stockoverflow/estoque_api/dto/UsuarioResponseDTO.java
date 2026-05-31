package com.stockoverflow.estoque_api.dto;

public record UsuarioResponseDTO(
        String id,
        String nome,
        String cpf,
        String role) {
}
