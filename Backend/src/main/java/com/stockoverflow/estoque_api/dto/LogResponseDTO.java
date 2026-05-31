package com.stockoverflow.estoque_api.dto;

import java.time.LocalDateTime;

public record LogResponseDTO(
    String id,
    LocalDateTime timestamp,
    String tipo,
    String mensagem,
    String estanteId,
    String robotId,
    String movimentacaoId
) {}
