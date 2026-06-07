package com.stockoverflow.estoque_api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object (DTO) que representa o formato de dados retornado ao frontend (React)
 * após o robô físico ter executado (ou falhado em executar) um comando.
 */
@Data // Gera Getters, Setters, toString, etc via Lombok
@AllArgsConstructor // Gera construtor com todos os parâmetros
@NoArgsConstructor // Gera construtor vazio necessário para alguns serializadores
public class RobotCommandResponse {
    
    // O ID único da transação gerado no backend, permitindo auditar esta chamada específica
    private String requestId;
    
    // O status do processamento no robô (ex: "OK" ou "ERROR")
    private String status;
    
    // Mensagem descritiva amigável do resultado (ex: "Movido para A3 com sucesso")
    private String message;
    
    // Dados adicionais/extras gerados no robô (ex: tempo em ms da tarefa, nível da bateria, etc)
    private Object data;
}
