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
    private final com.stockoverflow.estoque_api.repository.ArmazemRepository armazemRepository;

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
                .codigo(dto.codigo())
                .nome(dto.nome())
                .categoria(dto.categoria())
                .quantidade(dto.quantidade())
                .dataEntrada(dto.dataEntrada())
                .dataValidade(dto.dataValidade())
                .estante(estante)
                .posicaoX(1) // Default or get from request if we update DTO
                .posicaoY(1)
                .build();
        return toDTO(repository.save(produto));
    }

    public ProdutoResponseDTO registrarEntrada(com.stockoverflow.estoque_api.dto.ProdutoEntradaDTO dto) {
        Estante estante = estanteRepository.findById(dto.estanteId())
                .orElseThrow(() -> new RuntimeException("Estante não encontrada"));

        // Validar limites físicos da estante
        if (dto.x() < 1 || dto.x() > estante.getX() || dto.y() < 1 || dto.y() > estante.getY()) {
            throw new RuntimeException("Posição (" + dto.x() + ", " + dto.y() + ") é inválida para esta estante.");
        }

        // Validar capacidade máxima (baseada no total de produtos com quantidade > 0)
        long slotsOcupados = repository.findByEstanteId(estante.getId()).stream()
                .filter(p -> p.getQuantidade() > 0)
                .count();
        if (slotsOcupados >= estante.getCapacidadeMaxima()) {
            throw new RuntimeException("A estante está cheia!");
        }

        // Verificar se a vaga está ocupada
        Produto produtoExistente = repository.findByEstanteIdAndPosicaoXAndPosicaoY(estante.getId(), dto.x(), dto.y()).orElse(null);

        if (produtoExistente != null) {
            if (!produtoExistente.getCodigo().equals(dto.produto())) {
                if (produtoExistente.getQuantidade() > 0) {
                    throw new RuntimeException("A posição (" + dto.x() + ", " + dto.y() + ") já está ocupada por outro produto.");
                } else {
                    // Produto diferente, mas quantidade é 0. Podemos deletar ou sobrescrever?
                    // Vamos criar um novo e remover o antigo (ou reaproveitar se a lógica permitir)
                    repository.delete(produtoExistente);
                    produtoExistente = null;
                }
            }
        }

        Produto produto;
        if (produtoExistente != null) {
            produto = produtoExistente;
            produto.setQuantidade(produto.getQuantidade() + dto.quantidade());
        } else {
            // Busca dados de ref
            List<Produto> existentes = repository.findByCodigo(dto.produto());
            Produto ref = existentes.isEmpty() ? null : existentes.get(0);

            produto = Produto.builder()
                    .codigo(dto.produto())
                    .nome(dto.nome() != null ? dto.nome() : (ref != null ? ref.getNome() : dto.produto()))
                    .categoria(dto.categoria() != null ? dto.categoria() : (ref != null ? ref.getCategoria() : ""))
                    .dataValidade(dto.dataValidade() != null ? dto.dataValidade() : (ref != null ? ref.getDataValidade() : null))
                    .dataEntrada(java.time.LocalDate.now().toString())
                    .quantidade(dto.quantidade())
                    .posicaoX(dto.x())
                    .posicaoY(dto.y())
                    .estante(estante)
                    .build();
        }

        return toDTO(repository.save(produto));
    }

    public ProdutoResponseDTO registrarSaida(com.stockoverflow.estoque_api.dto.ProdutoSaidaDTO dto) {
        Produto produto = repository.findByEstanteIdAndPosicaoXAndPosicaoY(dto.estanteId(), dto.x(), dto.y())
                .orElseThrow(() -> new RuntimeException("Produto não encontrado na posição selecionada"));
        
        if (produto.getQuantidade() < dto.quantidade()) {
            throw new RuntimeException("Quantidade insuficiente no estoque");
        }
        produto.setQuantidade(produto.getQuantidade() - dto.quantidade());
        
        if (produto.getQuantidade() == 0) {
            repository.delete(produto);
            return null;
        }
        
        return toDTO(repository.save(produto));
    }


    public ProdutoResponseDTO toDTO(Produto produto) {
        if (produto == null) return null;
        return new ProdutoResponseDTO(
                produto.getId(),
                produto.getCodigo(),
                produto.getNome(),
                produto.getCategoria(),
                produto.getEstante() != null ? produto.getEstante().getId() : null,
                produto.getEstante() != null ? produto.getEstante().getNome() : null,
                produto.getPosicaoX(),
                produto.getPosicaoY(),
                produto.getDataEntrada(),
                produto.getDataValidade(),
                produto.getQuantidade()
        );
    }
}
