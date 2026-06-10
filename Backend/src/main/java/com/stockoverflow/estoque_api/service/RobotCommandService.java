package com.stockoverflow.estoque_api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockoverflow.estoque_api.dto.RobotCommandRequest;
import com.stockoverflow.estoque_api.dto.RobotCommandResponse;
import com.stockoverflow.estoque_api.model.Robot;
import com.stockoverflow.estoque_api.repository.RobotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeoutException;

/**
 * Serviço responsável por orquestrar a lógica de negócio do comando.
 * Ele recebe a requisição REST do frontend, traduz para o protocolo do firmware original
 * do ESP32 (usando "action", "x" e "y" em vez de "command" e "targetShelf") e envia via WebSocket.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RobotCommandService {

    private final Esp32WebSocketClient esp32Client;
    private final RobotRepository robotRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Traduz e envia um comando para o robô físico.
     */
    public RobotCommandResponse sendCommand(String robotId, RobotCommandRequest request) {
        // Valida se o robô existe no banco
        Robot robot = robotRepository.findById(robotId)
                .orElseThrow(() -> new RuntimeException("Robô não encontrado: " + robotId));

        String commandName = request.getCommand() != null ? request.getCommand().toLowerCase() : "";
        Map<String, Object> payload = new HashMap<>();

        if ("move".equals(commandName)) {
            payload.put("action", "move");

            // Usa diretamente as coordenadas X e Y do request
            int x = request.getTargetX() != null ? request.getTargetX() : 0;
            int y = request.getTargetY() != null ? request.getTargetY() : 0;
            
            payload.put("x", x);
            payload.put("y", y);
            log.info("[CMD] Enviando movimento X: {} e Y: {} para o ESP32", x, y);

        } else if ("stop".equals(commandName)) {
            payload.put("action", "stop");
        } else if ("status".equals(commandName)) {
            payload.put("action", "status");
        } else {
            throw new IllegalArgumentException("Comando não reconhecido pelo firmware do robô: " + request.getCommand());
        }

        try {
            // Converte o payload no formato {"action": "move", "x": 100, "y": 200}
            String payloadJson = objectMapper.writeValueAsString(payload);
            log.info("[CMD] Enviando JSON para ESP32: {}", payloadJson);

            // Envia e aguarda a resposta direta correspondente
            String rawResponse = esp32Client.sendAndWait(payloadJson);
            Map<?, ?> responseMap = objectMapper.readValue(rawResponse, Map.class);

            Object statusObj = responseMap.get("status");
            Object mensagemObj = responseMap.get("mensagem");

            // Retorna o resultado para o frontend
            return new RobotCommandResponse(
                    null, // Firmware original não possui requestId
                    statusObj != null ? statusObj.toString() : "OK",
                    mensagemObj != null ? mensagemObj.toString() : "Comando executado com sucesso",
                    responseMap
            );

        } catch (TimeoutException e) {
            log.error("[CMD] Timeout aguardando resposta do ESP32");
            throw new RuntimeException("ESP32 não respondeu no tempo esperado");
        } catch (IllegalStateException e) {
            log.error("[CMD] ESP32 desconectado");
            throw new RuntimeException("Robô não está conectado");
        } catch (Exception e) {
            log.error("[CMD] Erro ao enviar comando: {}", e.getMessage());
            throw new RuntimeException("Erro interno ao comunicar com o robô");
        }
    }

    public boolean isRobotConnected() {
        return esp32Client.isConnected();
    }
}
