package com.stockoverflow.estoque_api.controller;

import com.stockoverflow.estoque_api.dto.RobotMovimentRequestDTO;
import com.stockoverflow.estoque_api.dto.RobotMovimentResponseDTO;
import com.stockoverflow.estoque_api.service.RobotMovimentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class RobotMovimentController {

    private final RobotMovimentService service;

    @GetMapping("/api/robot-moviments")
    public List<RobotMovimentResponseDTO> listarTodos() {
        return service.listarTodos();
    }

    @GetMapping("/api/robot-moviments/{id}")
    public RobotMovimentResponseDTO buscarPorId(@PathVariable String id) {
        return service.buscarPorId(id);
    }

    @GetMapping("/api/robots/{robotId}/moviments")
    public List<RobotMovimentResponseDTO> listarPorRobot(@PathVariable String robotId) {
        return service.buscarPorRobot(robotId);
    }

    @PostMapping("/api/robot-moviments")
    @ResponseStatus(HttpStatus.CREATED)
    public RobotMovimentResponseDTO criar(@Valid @RequestBody RobotMovimentRequestDTO dto) {
        return service.criar(dto);
    }

    @DeleteMapping("/api/robot-moviments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable String id) {
        service.deletar(id);
    }
}
