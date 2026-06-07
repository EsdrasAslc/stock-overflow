package com.stockoverflow.estoque_api.service;

import com.stockoverflow.estoque_api.dto.ArmazemRequestDTO;
import com.stockoverflow.estoque_api.dto.ArmazemResponseDTO;
import com.stockoverflow.estoque_api.model.Armazem;
import com.stockoverflow.estoque_api.repository.ArmazemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ArmazemService {

    private final ArmazemRepository repository;

    public List<ArmazemResponseDTO> listarTodos() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    public ArmazemResponseDTO buscarPorId(String id) {
        Armazem armazem = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Armazém não encontrado"));
        return toDTO(armazem);
    }

    public ArmazemResponseDTO criar(ArmazemRequestDTO dto) {
        Armazem armazem = Armazem.builder()
                .nome(dto.nome())
                .build();
        return toDTO(repository.save(armazem));
    }

    // Renomeado de delete() para deletar() — padroniza a nomenclatura em português
    public void deletar(String id) {
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
