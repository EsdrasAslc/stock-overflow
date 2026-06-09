package com.stockoverflow.estoque_api.service;

import com.stockoverflow.estoque_api.dto.ProdutoResponseDTO;
import com.stockoverflow.estoque_api.dto.RobotRequestDTO;
import com.stockoverflow.estoque_api.dto.RobotResponseDTO;
import com.stockoverflow.estoque_api.model.Robot;
import com.stockoverflow.estoque_api.repository.RobotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RobotService {

    private final RobotRepository repository;
    private final ProdutoService produtoService;

    public List<RobotResponseDTO> listarTodos() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    public RobotResponseDTO buscarPorId(String id) {
        Robot robot = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Robô não encontrado"));
        return toDTO(robot);
    }

    public RobotResponseDTO criar(RobotRequestDTO dto) {
        Robot robot = Robot.builder()
                .id(dto.id())
                .status(dto.status())
                .build();
        return toDTO(repository.save(robot));
    }

    public void deletar(String id) {
        repository.deleteById(id);
    }

    public RobotResponseDTO toDTO(Robot robot) {
        if (robot == null) return null;
        ProdutoResponseDTO produtoAtual = produtoService.toDTO(robot.getProdutoAtual());
        return new RobotResponseDTO(
                robot.getId(),
                robot.getStatus() != null ? robot.getStatus().name() : null,
                produtoAtual
        );
    }
}
