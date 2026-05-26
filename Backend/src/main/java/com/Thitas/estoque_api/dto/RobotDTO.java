package com.Thitas.estoque_api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RobotDTO {
    private String id;
    private String status;
    private ProdutoDTO produtoAtual;
}
