package com.stockoverflow.estoque_api.service;

import com.stockoverflow.estoque_api.dto.EstanteRequestDTO;
import com.stockoverflow.estoque_api.dto.EstanteResponseDTO;
import com.stockoverflow.estoque_api.dto.RobotResponseDTO;
import com.stockoverflow.estoque_api.model.Armazem;
import com.stockoverflow.estoque_api.model.Estante;
import com.stockoverflow.estoque_api.repository.ArmazemRepository;
import com.stockoverflow.estoque_api.repository.EstanteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EstanteService {

    private final EstanteRepository repository;
    private final ArmazemRepository armazemRepository;
    private final RobotService robotService;

    public EstanteResponseDTO toDTO(Estante estante) {
        if (estante == null)
            return null;
        return new EstanteResponseDTO(
                estante.getId(),
                estante.getNome(),
                estante.getCapacidadeMaxima(),
                estante.getCapacidadeAtual(),
                estante.getX(),
                estante.getY(),
                estante.getArmazem() != null ? estante.getArmazem().getId() : null,
                robotService.toDTO(estante.getRobot())
        );
    }

    public List<EstanteResponseDTO> listarTodos() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    public List<EstanteResponseDTO> listarPorArmazem(String armazemId) {
        return repository.findByArmazemId(armazemId).stream()
                .map(this::toDTO)
                .toList();
    }

    public EstanteResponseDTO buscarPorId(String id) {
        Estante estante = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Estante não encontrada"));
        return toDTO(estante);
    }

    public RobotResponseDTO buscarRoboDaEstante(String estanteId) {
        Estante estante = repository.findById(estanteId)
                .orElseThrow(() -> new RuntimeException("Estante não encontrada"));
        if (estante.getRobot() == null) {
            throw new RuntimeException("Nenhum robô associado a esta estante");
        }
        return robotService.toDTO(estante.getRobot());
    }

    public EstanteResponseDTO criar(EstanteRequestDTO dto) {
        Armazem armazem = armazemRepository.findById(dto.armazemId())
                .orElseThrow(() -> new RuntimeException("Armazém não encontrado"));
        Estante estante = Estante.builder()
                .nome(dto.nome())
                .capacidadeMaxima(dto.capacidadeMaxima())
                .capacidadeAtual(0)
                .x(dto.x())
                .y(dto.y())
                .armazem(armazem)
                .build();
        return toDTO(repository.save(estante));
    }

    public void excluirPorId(String id) {
        repository.deleteById(id);
    }
}
