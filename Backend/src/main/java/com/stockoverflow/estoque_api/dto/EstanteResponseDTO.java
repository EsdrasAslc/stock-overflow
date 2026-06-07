package com.stockoverflow.estoque_api.dto;

public record EstanteResponseDTO(
    String id,
    String nome,
    Integer capacidadeMaxima,
    Integer capacidadeAtual,
    Integer x,
    Integer y,
    String armazemId,
    RobotResponseDTO robot
) {}
