package com.Thitas.estoque_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name = "armazens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Armazem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String nome;

}
