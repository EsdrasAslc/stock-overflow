package com.stockoverflow.estoque_api.dto;

import lombok.Data;

/**
 * Data Transfer Object (DTO) que representa o formato de dados enviado pelo frontend (React)
 * ao solicitar uma operação/comando no robô.
 */
@Data // Gera automaticamente Getters, Setters, toString, equals e hashCode via Lombok
public class RobotCommandRequest {
    
    // A ação/instrução principal desejada (ex: "MOVE", "PICK", "DROP", "STATUS")
    private String command;
    
    // A estante física alvo da operação (ex: "A3", "B1")
    private String targetShelf;
    
    // O ID do produto associado à operação (caso aplicável)
    private String productId;
}
