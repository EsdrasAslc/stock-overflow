package com.stockoverflow.estoque_api.controller;

import com.stockoverflow.estoque_api.dto.EstanteRequestDTO;
import com.stockoverflow.estoque_api.dto.EstanteResponseDTO;
import com.stockoverflow.estoque_api.dto.ProdutoResponseDTO;
import com.stockoverflow.estoque_api.dto.RobotResponseDTO;
import com.stockoverflow.estoque_api.service.EstanteService;
import com.stockoverflow.estoque_api.service.ProdutoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class EstanteController {

    private final EstanteService estanteService;
    private final ProdutoService produtoService;

    @GetMapping("/api/estantes")
    public List<EstanteResponseDTO> listarTodos() {
        return estanteService.listarTodos();
    }

    @GetMapping("/api/estantes/{id}")
    public EstanteResponseDTO buscarPorId(@PathVariable String id) {
        return estanteService.buscarPorId(id);
    }

    @PostMapping("/api/estantes")
    @ResponseStatus(HttpStatus.CREATED)
    public EstanteResponseDTO criar(@Valid @RequestBody EstanteRequestDTO dto) {
        return estanteService.criar(dto);
    }

    @GetMapping("/api/armazens/{armazemId}/estantes")
    public List<EstanteResponseDTO> listarEstantesPorArmazem(@PathVariable String armazemId) {
        return estanteService.listarPorArmazem(armazemId);
    }

    @GetMapping("/api/estantes/{estanteId}/produtos")
    public List<ProdutoResponseDTO> listarProdutosDaEstante(@PathVariable String estanteId) {
        return produtoService.buscarPorEstante(estanteId);
    }

    @GetMapping(value = {
            "/api/estantes/{estanteId}/robot/status",
            "/api/estantes/{estanteId}/robotstatus",
            "/api/estantes/{estanteId}/robot-status"
    })
    public RobotResponseDTO buscarStatusDoRoboDaEstante(@PathVariable String estanteId) {
        return estanteService.buscarRoboDaEstante(estanteId);
    }

    @DeleteMapping("/api/estantes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirPorId(@PathVariable String id) {
        estanteService.excluirPorId(id);
    }
}
