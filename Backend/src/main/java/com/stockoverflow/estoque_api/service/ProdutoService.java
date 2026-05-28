package com.stockoverflow.estoque_api.service;

import com.stockoverflow.estoque_api.dto.ProdutoDTO;
import com.stockoverflow.estoque_api.model.Produto;
import com.stockoverflow.estoque_api.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProdutoService {

    private final ProdutoRepository repository;

    public List<ProdutoDTO> buscarPorEstante(String estanteId) {
        return repository.findByEstanteId(estanteId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<Produto> buscarEntidadesPorEstante(String estanteId) {
        return repository.findByEstanteId(estanteId);
    }

    public ProdutoDTO salvar(Produto produto) {
        Produto salvo = repository.save(produto);
        return toDTO(salvo);
    }

    public ProdutoDTO toDTO(Produto produto) {
        if (produto == null) return null;
        return ProdutoDTO.builder()
                .id(produto.getId())
                .nome(produto.getNome())
                .quantidade(produto.getQuantidade())
                .estanteId(produto.getEstante() != null ? produto.getEstante().getId() : null)
                .build();
    }
}
