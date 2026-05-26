package com.Thitas.estoque_api.controller;

import com.Thitas.estoque_api.dto.ArmazemDTO;
import com.Thitas.estoque_api.model.Armazem;
import com.Thitas.estoque_api.service.ArmazemService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/armazens")
@RequiredArgsConstructor
public class ArmazemController {
    private final ArmazemService service;

    @GetMapping
    public List<ArmazemDTO> listarTodos() {
        return service.listarTodos();
    }

    @GetMapping("/{id}")
    public ArmazemDTO buscarPorId(@PathVariable String id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    public ArmazemDTO criar(@RequestBody Armazem armazem) {
        return service.salvar(armazem);
    }

    @DeleteMapping("/{id}")
    public void deletar(@PathVariable String id) {
        service.delete(id);
    }
}


