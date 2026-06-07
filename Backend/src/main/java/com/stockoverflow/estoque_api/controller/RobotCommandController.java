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
 * O tratamento de erros é feito de forma global pelo GlobalExceptionHandler —
 * por isso este controller não precisa de try-catch manuais.
 */
@RestController
@RequestMapping("/api/robots")
@RequiredArgsConstructor
public class RobotCommandController {

    private final RobotCommandService commandService;

    /**
     * Endpoint HTTP POST para enviar um comando ao robô.
     * Mapeado em: POST /api/robots/{id}/command
     *
     * @param id      Identificador do robô no banco de dados (ex: "ROB-01")
     * @param request Corpo do comando contendo a ação (ex: "MOVE") e parâmetros adicionais
     * @return Retorna status 200 OK com o JSON de resposta do ESP32
     */
    @PostMapping("/{id}/command")
    public ResponseEntity<RobotCommandResponse> sendCommand(
            @PathVariable String id,
            @RequestBody RobotCommandRequest request) {
        // Qualquer RuntimeException aqui é interceptada e formatada pelo GlobalExceptionHandler
        RobotCommandResponse response = commandService.sendCommand(id, request);
        return ResponseEntity.ok(response);
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
