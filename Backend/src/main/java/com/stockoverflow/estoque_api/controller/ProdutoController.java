package com.stockoverflow.estoque_api.controller;

import com.stockoverflow.estoque_api.dto.ProdutoRequestDTO;
import com.stockoverflow.estoque_api.dto.ProdutoResponseDTO;
import com.stockoverflow.estoque_api.service.ProdutoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/produtos")
@RequiredArgsConstructor
public class ProdutoController {

    private final ProdutoService service;

    @GetMapping
    public List<ProdutoResponseDTO> listarTodos() {
        return service.listarTodos();
    }

    @GetMapping("/{id}")
    public ProdutoResponseDTO buscarPorId(@PathVariable String id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProdutoResponseDTO criar(@Valid @RequestBody ProdutoRequestDTO dto) {
        return service.criar(dto);
    }

    @PostMapping("/entrada")
    public ProdutoResponseDTO registrarEntrada(@Valid @RequestBody com.stockoverflow.estoque_api.dto.ProdutoEntradaDTO dto) {
        return service.registrarEntrada(dto);
    }

    @PostMapping("/saida")
    public ProdutoResponseDTO registrarSaida(@Valid @RequestBody com.stockoverflow.estoque_api.dto.ProdutoSaidaDTO dto) {
        return service.registrarSaida(dto);
    }

}
