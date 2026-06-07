package com.stockoverflow.estoque_api.controller;

import com.stockoverflow.estoque_api.dto.RobotCommandRequest;
import com.stockoverflow.estoque_api.dto.RobotCommandResponse;
import com.stockoverflow.estoque_api.service.RobotCommandService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller expondo a API HTTP para a interação do frontend (React) com o robô físico.
 */
@RestController // Declara a classe como um controlador REST do Spring (retornos viram JSON automaticamente)
@RequestMapping("/api/robots") // Mapeia todos os endpoints desta classe para iniciarem com /api/robots
@RequiredArgsConstructor // Cria construtor automático injetando dependências finais (final)
public class RobotCommandController {

    private final RobotCommandService commandService; // Injeta o serviço de comando

    /**
     * Endpoint HTTP POST para enviar um comando ao robô.
     * Mapeado em: POST /api/robots/{id}/command
     * 
     * @param id Identificador do robô no banco de dados (ex: "ROB-01")
     * @param request Corpo do comando contendo a ação (ex: "MOVE") e parâmetros adicionais
     * @return Retorna status 200 OK com o JSON de resposta se der certo, ou status de erro adequado (503/504/500)
     */
    @PostMapping("/{id}/command")
    public ResponseEntity<?> sendCommand(
            @PathVariable String id, // Captura o ID do robô a partir do parâmetro de caminho na URL
            @RequestBody RobotCommandRequest request) { // Desserializa o JSON de entrada para a classe Java RobotCommandRequest
        try {
            // Chama a lógica de negócio do serviço e aguarda o retorno síncrono do robô
            RobotCommandResponse response = commandService.sendCommand(id, request);
            return ResponseEntity.ok(response); // Retorna HTTP 200 com os dados do robô
        } catch (RuntimeException e) {
            String msg = e.getMessage();
            
            // Tratamento de falhas:
            // Se o robô físico estourou o tempo limite de resposta, devolve HTTP 504 Gateway Timeout
            if (msg.contains("não respondeu")) {
                return ResponseEntity.status(504).body(Map.of("error", msg));
            }
            // Se a conexão física com o robô (WebSocket) estiver caída, devolve HTTP 503 Service Unavailable
            if (msg.contains("não está conectado")) {
                return ResponseEntity.status(503).body(Map.of("error", msg));
            }
            // Qualquer outra exceção interna, devolve HTTP 500 Internal Server Error
            return ResponseEntity.status(500).body(Map.of("error", msg));
        }
    }

    /**
     * Endpoint HTTP GET para verificar o estado da conexão física com o ESP32.
     * Mapeado em: GET /api/robots/connection-status
     * 
     * @return Retorna HTTP 200 contendo {"connected": true/false}
     */
    @GetMapping("/connection-status")
    public ResponseEntity<?> connectionStatus() {
        return ResponseEntity.ok(Map.of(
                "connected", commandService.isRobotConnected()
        ));
    }
}
