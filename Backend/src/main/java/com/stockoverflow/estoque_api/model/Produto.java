package com.stockoverflow.estoque_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "produtos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Produto {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String codigo;

    @Column(nullable = false)
    private String nome;

    @Column
    private String categoria;

    @Column(nullable = false)
    private Integer quantidade;

    @Column(name = "data_entrada")
    private String dataEntrada;

    @Column(name = "data_saida")
    private String dataSaida;

    @Column(name = "data_validade")
    private String dataValidade;

    @Column(name = "posicao_x", nullable = false)
    private Integer posicaoX;

    @Column(name = "posicao_y", nullable = false)
    private Integer posicaoY;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estante_id", nullable = false)
    private Estante estante;
}
