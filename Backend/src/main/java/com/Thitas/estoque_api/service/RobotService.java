package com.Thitas.estoque_api.service;

import com.Thitas.estoque_api.dto.RobotDTO;
import com.Thitas.estoque_api.model.Robot;
import com.Thitas.estoque_api.repository.RobotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RobotService {

    private final RobotRepository repository;
    private final ProdutoService produtoService;

    public RobotDTO buscarPorId(String id) {
        Robot robot = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Robô não encontrado"));
        return toDTO(robot);
    }

    public Robot salvar(Robot robot) {
        return repository.save(robot);
    }

    public RobotDTO toDTO(Robot robot) {
        if (robot == null) return null;
        return RobotDTO.builder()
                .id(robot.getId())
                .status(robot.getStatus())
                .produtoAtual(produtoService.toDTO(robot.getProdutoAtual()))
                .build();
    }
}
