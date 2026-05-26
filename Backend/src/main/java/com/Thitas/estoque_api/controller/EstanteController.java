package com.Thitas.estoque_api.controller;

import com.Thitas.estoque_api.dto.EstanteDTO;
import com.Thitas.estoque_api.dto.ProdutoDTO;
import com.Thitas.estoque_api.dto.RobotDTO;
import com.Thitas.estoque_api.model.Estante;
import com.Thitas.estoque_api.service.EstanteService;
import com.Thitas.estoque_api.service.ProdutoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class EstanteController {

    private final EstanteService estanteService;
    private final ProdutoService produtoService;

    @GetMapping("/api/estantes")
    public List<EstanteDTO> listarTodos() {
        return estanteService.listarTodos();
    }

    @GetMapping("/api/estantes/{id}")
    public EstanteDTO buscarPorId(@PathVariable String id) {
        return estanteService.buscarPorId(id);
    }

    @PostMapping("/api/estantes")
    public Estante salvar(@RequestBody Estante estante) {
        return estanteService.salvar(estante);
    }

    @GetMapping("/api/armazens/{armazemId}/estantes")
    public List<EstanteDTO> listarEstantesPorArmazem(@PathVariable String armazemId) {
        return estanteService.listarPorArmazem(armazemId);
    }

    @GetMapping("/api/estantes/{estanteId}/produtos")
    public List<ProdutoDTO> listarProdutosDaEstante(@PathVariable String estanteId) {
        return produtoService.buscarPorEstante(estanteId);
    }

    @GetMapping(value = {
            "/api/estantes/{estanteId}/robot/status",
            "/api/estantes/{estanteId}/robotstatus",
            "/api/estantes/{estanteId}/robot-status"
    })
    public RobotDTO buscarStatusDoRoboDaEstante(@PathVariable String estanteId) {
        return estanteService.buscarRoboDaEstante(estanteId);
    }

    @DeleteMapping("/api/estantes/{id}")
    public Estante excluirPorId(@PathVariable String id) {
        return estanteService.excluirPorId(id);
    }
}
