package com.Thitas.estoque_api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EstanteDTO {
    private String id;
    private String nome;
    private Integer capacidadeMaxima;
    private Integer capacidadeAtual;
    private String armazemId;
    private RobotDTO robot;
}
