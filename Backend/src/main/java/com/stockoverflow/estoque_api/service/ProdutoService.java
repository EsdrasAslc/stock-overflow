package com.stockoverflow.estoque_api.service;

import com.stockoverflow.estoque_api.dto.ProdutoRequestDTO;
import com.stockoverflow.estoque_api.dto.ProdutoResponseDTO;
import com.stockoverflow.estoque_api.model.Estante;
import com.stockoverflow.estoque_api.model.Produto;
import com.stockoverflow.estoque_api.repository.EstanteRepository;
import com.stockoverflow.estoque_api.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProdutoService {

    private final ProdutoRepository repository;
    private final EstanteRepository estanteRepository;

    public List<ProdutoResponseDTO> listarTodos() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    public ProdutoResponseDTO buscarPorId(String id) {
        Produto produto = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));
        return toDTO(produto);
    }

    public List<ProdutoResponseDTO> buscarPorEstante(String estanteId) {
        return repository.findByEstanteId(estanteId).stream()
                .map(this::toDTO)
                .toList();
    }

    public ProdutoResponseDTO criar(ProdutoRequestDTO dto) {
        Estante estante = estanteRepository.findById(dto.estanteId())
                .orElseThrow(() -> new RuntimeException("Estante não encontrada"));
        Produto produto = Produto.builder()
                .nome(dto.nome())
                .quantidade(dto.quantidade())
                .estante(estante)
                .build();
        return toDTO(repository.save(produto));
    }

    public void deletar(String id) {
        repository.deleteById(id);
    }

    public ProdutoResponseDTO toDTO(Produto produto) {
        if (produto == null) return null;
        return new ProdutoResponseDTO(
                produto.getId(),
                produto.getNome(),
                produto.getQuantidade(),
                produto.getEstante() != null ? produto.getEstante().getId() : null
        );
    }
}
