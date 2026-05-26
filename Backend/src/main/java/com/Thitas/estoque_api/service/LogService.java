package com.Thitas.estoque_api.service;

import com.Thitas.estoque_api.dto.LogDTO;
import com.Thitas.estoque_api.model.Log;
import com.Thitas.estoque_api.repository.LogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LogService {

    private final LogRepository repository;

    public LogDTO toDTO(Log log) {
        if (log == null)
            return null;
        return LogDTO.builder()
                .id(log.getId())
                .timestamp(log.getTimestamp())
                .tipo(log.getTipo())
                .mensagem(log.getMensagem())
                .estanteId(log.getEstanteId())
                .robotId(log.getRobotId())
                .build();
    }

    public LogDTO buscarUltimoLog() {
        Log log = repository.findFirstByOrderByTimestampDesc()
                .orElseThrow(() -> new RuntimeException("Nenhum log registrado no sistema"));
        return toDTO(log);
    }

    public LogDTO salvar(Log log) {
        Log salvo = repository.save(log);
        return toDTO(salvo);
    }

}
