package com.stockoverflow.estoque_api.service;

import com.stockoverflow.estoque_api.dto.DashboardMetricsDTO;
import com.stockoverflow.estoque_api.repository.EstanteRepository;
import com.stockoverflow.estoque_api.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProdutoRepository produtoRepository;
    private final EstanteRepository estanteRepository;

    public DashboardMetricsDTO getMetrics() {
        int totalProdutos = (int) produtoRepository.count();
        int totalCapacidade = estanteRepository.findAll().stream()
                .mapToInt(e -> e.getCapacidadeMaxima())
                .sum();
        int capacidadeOcupada = totalProdutos; // simplification

        String slotsOcupados = capacidadeOcupada + "/" + (totalCapacidade > 0 ? totalCapacidade : 64);
        int pct = totalCapacidade > 0 ? (capacidadeOcupada * 100 / totalCapacidade) : 0;

        DashboardMetricsDTO.KpisDTO kpis = new DashboardMetricsDTO.KpisDTO(
                totalProdutos, slotsOcupados, 0, 0 // TODO: calc vencimentos
        );

        DashboardMetricsDTO.StorageDTO storage = new DashboardMetricsDTO.StorageDTO(
                capacidadeOcupada, (totalCapacidade - capacidadeOcupada), pct
        );

        DashboardMetricsDTO.RobotTelemetryDTO robot = new DashboardMetricsDTO.RobotTelemetryDTO(
                "STANDBY", "38.2°C", 62, 87, "1.247", "14h 32min", "12 dias atrás", "v2.4.1"
        );

        List<DashboardMetricsDTO.CategoryItemDTO> categorias = List.of(
                new DashboardMetricsDTO.CategoryItemDTO("Eletrônico", 18, "#10b981"),
                new DashboardMetricsDTO.CategoryItemDTO("Mecânico", 14, "#3b82f6"),
                new DashboardMetricsDTO.CategoryItemDTO("Químico", 9, "#f59e0b")
        );

        List<DashboardMetricsDTO.LogItemDTO> logs = List.of(
            new DashboardMetricsDTO.LogItemDTO("1", "Sistema", "Guardar", "Mock", "1A1", "SUCESSO", "agora")
        );

        return new DashboardMetricsDTO(kpis, categorias, storage, robot, logs);
    }
}
