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
@RequestMapping("/api/robot-moviments")
@RequiredArgsConstructor
public class RobotMovimentController {

    private final RobotMovimentService service;

    @GetMapping
    public List<RobotMovimentResponseDTO> listarTodos() {
        return service.listarTodos();
    }

    @GetMapping("/{id}")
    public RobotMovimentResponseDTO buscarPorId(@PathVariable String id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RobotMovimentResponseDTO criar(@Valid @RequestBody RobotMovimentRequestDTO dto) {
        return service.criar(dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable String id) {
        service.deletar(id);
    }
}
