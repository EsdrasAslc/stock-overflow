package com.stockoverflow.estoque_api.service;

import com.stockoverflow.estoque_api.dto.RobotMovimentRequestDTO;
import com.stockoverflow.estoque_api.dto.RobotMovimentResponseDTO;
import com.stockoverflow.estoque_api.model.Estante;
import com.stockoverflow.estoque_api.model.Produto;
import com.stockoverflow.estoque_api.model.Robot;
import com.stockoverflow.estoque_api.model.RobotMoviment;
import com.stockoverflow.estoque_api.model.TipoMovimento;
import com.stockoverflow.estoque_api.model.Usuario;
import com.stockoverflow.estoque_api.repository.EstanteRepository;
import com.stockoverflow.estoque_api.repository.ProdutoRepository;
import com.stockoverflow.estoque_api.repository.RobotMovimentRepository;
import com.stockoverflow.estoque_api.repository.RobotRepository;
import com.stockoverflow.estoque_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RobotMovimentService {

    private final RobotMovimentRepository repository;
    private final RobotRepository robotRepository;
    private final ProdutoRepository produtoRepository;
    private final EstanteRepository estanteRepository;
    private final UsuarioRepository usuarioRepository;

    public List<RobotMovimentResponseDTO> listarTodos() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    public RobotMovimentResponseDTO buscarPorId(String id) {
        RobotMoviment moviment = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movimentação de robô não encontrada"));
        return toDTO(moviment);
    }

    public List<RobotMovimentResponseDTO> buscarPorRobot(String robotId) {
        return repository.findByRobotId(robotId).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public RobotMovimentResponseDTO criar(RobotMovimentRequestDTO dto) {
        Robot robot = robotRepository.findById(dto.robotId())
                .orElseThrow(() -> new RuntimeException("Robô não encontrado"));
        Produto produto = produtoRepository.findById(dto.produtoId())
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));

        Estante origemEstante;
        Estante destinoEstante;

        if (dto.tipoMovimento() == TipoMovimento.REMOVER) {
            origemEstante = produto.getEstante();
            destinoEstante = estanteRepository.findById(dto.estanteId())
                    .orElseThrow(() -> new RuntimeException("Estante de destino não encontrada"));
        } else {
            origemEstante = estanteRepository.findById(dto.estanteId())
                    .orElseThrow(() -> new RuntimeException("Estante de origem não encontrada"));
            destinoEstante = produto.getEstante();
        }

        Usuario solicitadoPor = null;
        if (dto.solicitadoPorId() != null && !dto.solicitadoPorId().isBlank()) {
            solicitadoPor = usuarioRepository.findById(dto.solicitadoPorId())
                    .orElseThrow(() -> new RuntimeException("Usuário solicitante não encontrado"));
        }

        RobotMoviment moviment = RobotMoviment.builder()
                .robot(robot)
                .produto(produto)
                .origemEstante(origemEstante)
                .destinoEstante(destinoEstante)
                .timestamp(LocalDateTime.now())
                .tipoMovimento(dto.tipoMovimento())
                .statusMovimentacao(com.stockoverflow.estoque_api.model.StatusMovimentacao.PENDENTE)
                .solicitadoPor(solicitadoPor)
                .build();

        return toDTO(repository.save(moviment));
    }

    public void deletar(String id) {
        repository.deleteById(id);
    }

    public RobotMovimentResponseDTO toDTO(RobotMoviment moviment) {
        if (moviment == null) return null;
        return new RobotMovimentResponseDTO(
                moviment.getId(),
                moviment.getRobot() != null ? moviment.getRobot().getId() : null,
                moviment.getProduto() != null ? moviment.getProduto().getId() : null,
                moviment.getOrigemEstante() != null ? moviment.getOrigemEstante().getId() : null,
                moviment.getDestinoEstante() != null ? moviment.getDestinoEstante().getId() : null,
                moviment.getTimestamp(),
                moviment.getTipoMovimento() != null ? moviment.getTipoMovimento().name() : null,
                moviment.getStatusMovimentacao() != null ? moviment.getStatusMovimentacao().name() : null,
                moviment.getSolicitadoPor() != null ? moviment.getSolicitadoPor().getNome() : null
        );
    }
}
