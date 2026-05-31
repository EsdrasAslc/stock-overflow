package com.stockoverflow.estoque_api.service;

import com.stockoverflow.estoque_api.dto.ArmazemRequestDTO;
import com.stockoverflow.estoque_api.dto.ArmazemResponseDTO;
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

    public List<ArmazemResponseDTO> listarTodos() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ArmazemResponseDTO buscarPorId(String id) {
        Armazem armazem = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Armazém não encontrado"));
        return toDTO(armazem);
    }

    public Armazem buscarEntidadePorId(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Armazém não encontrado"));
    }

    public ArmazemResponseDTO criar(ArmazemRequestDTO dto) {
        Armazem armazem = Armazem.builder()
                .nome(dto.nome())
                .build();
        return toDTO(repository.save(armazem));
    }

    public void delete(String id) {
        repository.deleteById(id);
    }

    public ArmazemResponseDTO toDTO(Armazem armazem) {
        if (armazem == null) return null;
        return new ArmazemResponseDTO(
                armazem.getId(),
                armazem.getNome()
        );
    }
}
