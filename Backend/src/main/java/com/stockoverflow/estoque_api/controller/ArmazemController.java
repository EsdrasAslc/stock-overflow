package com.stockoverflow.estoque_api.controller;

import com.stockoverflow.estoque_api.dto.ArmazemRequestDTO;
import com.stockoverflow.estoque_api.dto.ArmazemResponseDTO;
import com.stockoverflow.estoque_api.dto.EstanteResponseDTO;
import com.stockoverflow.estoque_api.service.ArmazemService;
import com.stockoverflow.estoque_api.service.EstanteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/armazens")
@RequiredArgsConstructor
public class ArmazemController {

    private final ArmazemService service;
    private final EstanteService estanteService;

    @GetMapping
    public List<ArmazemResponseDTO> listarTodos() {
        return service.listarTodos();
    }

    @GetMapping("/{id}")
    public ArmazemResponseDTO buscarPorId(@PathVariable String id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ArmazemResponseDTO criar(@Valid @RequestBody ArmazemRequestDTO dto) {
        return service.criar(dto);
    }

    @GetMapping("/{armazemId}/estantes")
    public List<EstanteResponseDTO> listarEstantesPorArmazem(@PathVariable String armazemId) {
        return estanteService.listarPorArmazem(armazemId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable String id) {
        service.deletar(id);
    }
}
