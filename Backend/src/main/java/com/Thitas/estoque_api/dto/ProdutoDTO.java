package com.Thitas.estoque_api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProdutoDTO {
    private String id;
    private String nome;
    private Integer quantidade;
    private String estanteId;
}
