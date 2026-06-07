package com.stockoverflow.estoque_api.controller;

import com.stockoverflow.estoque_api.dto.RobotMovimentResponseDTO;
import com.stockoverflow.estoque_api.dto.RobotRequestDTO;
import com.stockoverflow.estoque_api.dto.RobotResponseDTO;
import com.stockoverflow.estoque_api.service.RobotMovimentService;
import com.stockoverflow.estoque_api.service.RobotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/robots")
@RequiredArgsConstructor
public class RobotController {

    private final RobotService service;
    private final RobotMovimentService robotMovimentService;

    @GetMapping
    public List<RobotResponseDTO> listarTodos() {
        return service.listarTodos();
    }

    @GetMapping("/{id}")
    public RobotResponseDTO buscarPorId(@PathVariable String id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RobotResponseDTO criar(@Valid @RequestBody RobotRequestDTO dto) {
        return service.criar(dto);
    }

    @GetMapping("/{robotId}/moviments")
    public List<RobotMovimentResponseDTO> listarPorRobot(@PathVariable String robotId) {
        return robotMovimentService.buscarPorRobot(robotId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable String id) {
        service.deletar(id);
    }
}
