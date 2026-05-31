package com.stockoverflow.estoque_api.service;

import com.stockoverflow.estoque_api.dto.LogResponseDTO;
import com.stockoverflow.estoque_api.model.Log;
import com.stockoverflow.estoque_api.repository.LogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LogService {

    private final LogRepository repository;

    public LogResponseDTO toDTO(Log log) {
        if (log == null)
            return null;
        return new LogResponseDTO(
                log.getId(),
                log.getTimestamp(),
                log.getTipo() != null ? log.getTipo().name() : null,
                log.getMensagem(),
                log.getEstante() != null ? log.getEstante().getId() : null,
                log.getRobot() != null ? log.getRobot().getId() : null,
                log.getMovimentacao() != null ? log.getMovimentacao().getId() : null
        );
    }

    public LogResponseDTO buscarUltimoLog() {
        Log log = repository.findFirstByOrderByTimestampDesc()
                .orElseThrow(() -> new RuntimeException("Nenhum log registrado no sistema"));
        return toDTO(log);
    }

    public List<LogResponseDTO> listarTodos() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public LogResponseDTO salvar(Log log) {
        return toDTO(repository.save(log));
    }
}
