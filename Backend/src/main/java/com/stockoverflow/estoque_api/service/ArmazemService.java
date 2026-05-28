package com.stockoverflow.estoque_api.service;

import com.stockoverflow.estoque_api.dto.ArmazemDTO;
import com.stockoverflow.estoque_api.model.Armazem;
import com.stockoverflow.estoque_api.repository.ArmazemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArmazemService {

    private final ArmazemRepository repository;

    public List<ArmazemDTO> listarTodos() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ArmazemDTO buscarPorId(String id) {
        Armazem armazem = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Armazém não encontrado"));
        return toDTO(armazem);
    }

    public Armazem buscarEntidadePorId(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Armazém não encontrado"));
    }

    public ArmazemDTO salvar(Armazem armazem) {
        Armazem salvo = repository.save(armazem);
        return toDTO(salvo);
    }

    public void delete(String id) {
        repository.deleteById(id);
    }

    public ArmazemDTO toDTO(Armazem armazem) {
        if (armazem == null) return null;
        return ArmazemDTO.builder()
                .id(armazem.getId())
                .nome(armazem.getNome())
                .build();
    }
}
