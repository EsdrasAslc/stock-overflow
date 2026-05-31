package com.stockoverflow.estoque_api.dto;

import com.stockoverflow.estoque_api.model.TipoMovimento;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RobotMovimentRequestDTO(
    @NotBlank(message = "O ID do robô é obrigatório")
    String robotId,

    @NotBlank(message = "O ID do produto é obrigatório")
    String produtoId,

    @NotBlank(message = "O ID da estante é obrigatório")
    String estanteId,

    @NotNull(message = "O tipo de movimento é obrigatório")
    TipoMovimento tipoMovimento,

    String solicitadoPorId
) {}
