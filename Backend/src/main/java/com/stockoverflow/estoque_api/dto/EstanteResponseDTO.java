package com.stockoverflow.estoque_api.dto;

public record EstanteResponseDTO(
    String id,
    String nome,
    Integer capacidadeMaxima,
    Integer capacidadeAtual,
    String armazemId,
    RobotResponseDTO robot
) {}
