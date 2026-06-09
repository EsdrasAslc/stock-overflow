package com.stockoverflow.estoque_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "robots")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Robot {
    @Id
    private String id; // e.g. "ROB-01"

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private RobotStatus status; // e.g. "EM_MOVIMENTO", "AGUARDANDO"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produto_atual_id")
    private Produto produtoAtual;

}
