package com.Thitas.estoque_api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogDTO {
    private String id;
    private LocalDateTime timestamp;
    private String tipo;
    private String mensagem;
    private String estanteId;
    private String robotId;
}
