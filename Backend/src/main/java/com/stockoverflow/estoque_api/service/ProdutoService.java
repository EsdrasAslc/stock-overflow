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
                .build();
        return toDTO(repository.save(produto));
    }

    public ProdutoResponseDTO registrarEntrada(com.stockoverflow.estoque_api.dto.ProdutoEntradaDTO dto) {
        Estante estante = estanteRepository.findByNome(dto.posicao()).orElseGet(() -> {
            com.stockoverflow.estoque_api.model.Armazem armazem = armazemRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new RuntimeException("Nenhum armazém disponível para criar estante"));
            Estante nova = Estante.builder()
                    .nome(dto.posicao())
                    .capacidadeMaxima(100)
                    .capacidadeAtual(0)
                    .x(1) // default
                    .y(1) // default
                    .armazem(armazem)
                    .build();
            return estanteRepository.save(nova);
        });
        
        Produto produto = repository.findByCodigoAndEstanteNome(dto.produto(), dto.posicao())
                .orElseGet(() -> {
                    // Busca se já existe um produto com esse código em outro lugar para reaproveitar os dados
                    List<Produto> existentes = repository.findByCodigo(dto.produto());
                    Produto ref = existentes.isEmpty() ? null : existentes.get(0);
                    
                    return Produto.builder()
                            .codigo(dto.produto())
                            .nome(dto.nome() != null ? dto.nome() : (ref != null ? ref.getNome() : dto.produto()))
                            .categoria(dto.categoria() != null ? dto.categoria() : (ref != null ? ref.getCategoria() : ""))
                            .dataValidade(dto.dataValidade() != null ? dto.dataValidade() : (ref != null ? ref.getDataValidade() : null))
                            .dataEntrada(java.time.LocalDate.now().toString())
                            .quantidade(0)
                            .estante(estante)
                            .build();
                });
        
        produto.setQuantidade(produto.getQuantidade() + dto.quantidade());
        return toDTO(repository.save(produto));
    }

    public ProdutoResponseDTO registrarSaida(com.stockoverflow.estoque_api.dto.ProdutoSaidaDTO dto) {
        Produto produto = repository.findByCodigoAndEstanteNome(dto.produto(), dto.posicao())
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

    public void deletar(String id) {
        repository.deleteById(id);
    }

    public ProdutoResponseDTO toDTO(Produto produto) {
        if (produto == null) return null;
        return new ProdutoResponseDTO(
                produto.getId(),
                produto.getCodigo(),
                produto.getNome(),
                produto.getCategoria(),
                produto.getEstante() != null ? produto.getEstante().getNome() : null,
                produto.getDataEntrada(),
                produto.getDataValidade(),
                produto.getQuantidade()
        );
    }
}
