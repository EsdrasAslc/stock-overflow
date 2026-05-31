package com.stockoverflow.estoque_api.dto;

import com.stockoverflow.estoque_api.model.RobotStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RobotRequestDTO(
    @NotBlank(message = "O ID do robô não pode estar em branco")
    String id,

    @NotNull(message = "O status do robô é obrigatório")
    RobotStatus status
) {}
