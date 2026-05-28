package com.stockoverflow.estoque_api.service;

import com.stockoverflow.estoque_api.dto.EstanteDTO;
import com.stockoverflow.estoque_api.dto.RobotDTO;
import com.stockoverflow.estoque_api.model.Estante;
import com.stockoverflow.estoque_api.repository.EstanteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EstanteService {
    private final EstanteRepository repository;
    private final RobotService robotService;

    public EstanteDTO toDTO(Estante estante) {
        if (estante == null)
            return null;
        return EstanteDTO.builder()
                .id(estante.getId())
                .nome(estante.getNome())
                .capacidadeMaxima(estante.getCapacidadeMaxima())
                .capacidadeAtual(estante.getCapacidadeAtual())
                .armazemId(estante.getArmazem() != null ? estante.getArmazem().getId() : null)
                .robot(robotService.toDTO(estante.getRobot()))
                .build();
    }

    public List<EstanteDTO> listarTodos() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<EstanteDTO> listarPorArmazem(String armazemId) {
        return repository.findByArmazemId(armazemId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public EstanteDTO buscarPorId(String id) {
        Estante estante = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Estante não encontrada"));
        return toDTO(estante);
    }

    public RobotDTO buscarRoboDaEstante(String estanteId) {
        Estante estante = repository.findById(estanteId)
                .orElseThrow(() -> new RuntimeException("Estante não encontrada"));
        if (estante.getRobot() == null) {
            throw new RuntimeException("Nenhum robô associado a esta estante");
        }
        return robotService.toDTO(estante.getRobot());
    }

    public Estante salvar(Estante estante) {
        return repository.save(estante);
    }

    public Estante excluirPorId(String id) {
        repository.deleteById(id);
        return null;
    }

}
