package com.stockoverflow.estoque_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "estantes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Estante {
    @Id
    private String id; // e.g. "EST-01"

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private Integer capacidadeMaxima;

    @Column(nullable = false)
    private Integer capacidadeAtual;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "armazem_id", nullable = false)
    private Armazem armazem;

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "robot_id")
    private Robot robot;
}

