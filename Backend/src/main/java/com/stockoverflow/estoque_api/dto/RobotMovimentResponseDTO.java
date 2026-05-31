package com.stockoverflow.estoque_api.dto;

import java.time.LocalDateTime;

public record RobotMovimentResponseDTO(
    String id,
    String robotId,
    String produtoId,
    String origemEstanteId,
    String destinoEstanteId,
    LocalDateTime timestamp,
    String tipoMovimento,
    String statusMovimentacao,
    String solicitadoPorNome
) {}
