package com.stockoverflow.estoque_api.controller;

import com.stockoverflow.estoque_api.dto.UsuarioRequestDTO;
import com.stockoverflow.estoque_api.dto.UsuarioResponseDTO;
import com.stockoverflow.estoque_api.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService service;

    @GetMapping
    public List<UsuarioResponseDTO> listarTodos() {
        return service.listarTodos();
    }

    @GetMapping("/{id}")
    public UsuarioResponseDTO buscarPorId(@PathVariable String id) {
        return service.buscarPorId(id);
    }

    @PostMapping("/login")
    public UsuarioResponseDTO login(@Valid @RequestBody com.stockoverflow.estoque_api.dto.LoginRequestDTO dto) {
        return service.login(dto);
    }

    @GetMapping("/cpf")
    public UsuarioResponseDTO buscarPorCpf(@RequestBody UsuarioRequestDTO dto) {
        return service.buscarPorCpf(dto);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponseDTO criar(@Valid @RequestBody UsuarioRequestDTO dto) {
        return service.criar(dto);
    }

    @PutMapping("/{id}")
    public UsuarioResponseDTO atualizar(@PathVariable String id,
            @Valid @RequestBody UsuarioRequestDTO dto) {
        return service.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable String id) {
        service.deletar(id);
    }
}
