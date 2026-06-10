package com.stockoverflow.estoque_api.service;

import com.stockoverflow.estoque_api.dto.DashboardMetricsDTO;
import com.stockoverflow.estoque_api.repository.EstanteRepository;
import com.stockoverflow.estoque_api.repository.ProdutoRepository;
import com.stockoverflow.estoque_api.repository.LogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProdutoRepository produtoRepository;
    private final EstanteRepository estanteRepository;
    private final LogRepository logRepository;

    public DashboardMetricsDTO getMetrics() {
        List<com.stockoverflow.estoque_api.model.Produto> todosProdutos = produtoRepository.findAll();

        int totalProdutos = todosProdutos.size();
        int lotesVencidos = 0;
        int vencem30Dias = 0;
        
        java.time.LocalDate hoje = java.time.LocalDate.now();
        java.time.LocalDate daqui30Dias = hoje.plusDays(30);

        for (com.stockoverflow.estoque_api.model.Produto p : todosProdutos) {
            if (p.getDataValidade() != null && !p.getDataValidade().isEmpty()) {
                try {
                    java.time.LocalDate val = java.time.LocalDate.parse(p.getDataValidade());
                    if (val.isBefore(hoje)) {
                        lotesVencidos++;
                    } else if (!val.isAfter(daqui30Dias)) {
                        vencem30Dias++;
                    }
                } catch (Exception e) {}
            }
        }

        int totalCapacidade = estanteRepository.findAll().stream()
                .mapToInt(e -> e.getCapacidadeMaxima())
                .sum();
        int capacidadeOcupada = (int) todosProdutos.stream().filter(p -> p.getQuantidade() > 0).count();

        String slotsOcupados = capacidadeOcupada + "/" + (totalCapacidade > 0 ? totalCapacidade : 0);
        int pct = totalCapacidade > 0 ? (capacidadeOcupada * 100 / totalCapacidade) : 0;

        DashboardMetricsDTO.KpisDTO kpis = new DashboardMetricsDTO.KpisDTO(
                totalProdutos, slotsOcupados, vencem30Dias, lotesVencidos
        );

        DashboardMetricsDTO.StorageDTO storage = new DashboardMetricsDTO.StorageDTO(
                capacidadeOcupada, (totalCapacidade - capacidadeOcupada), pct
        );

        // Agrupando por categoria
        java.util.Map<String, Integer> catMap = new java.util.HashMap<>();
        for (com.stockoverflow.estoque_api.model.Produto p : todosProdutos) {
            String cat = (p.getCategoria() != null && !p.getCategoria().isEmpty()) ? p.getCategoria() : "Sem Categoria";
            catMap.put(cat, catMap.getOrDefault(cat, 0) + 1);
        }

        String[] cores = {"#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"};
        List<DashboardMetricsDTO.CategoryItemDTO> categorias = new java.util.ArrayList<>();
        int corIdx = 0;
        for (java.util.Map.Entry<String, Integer> entry : catMap.entrySet()) {
            categorias.add(new DashboardMetricsDTO.CategoryItemDTO(entry.getKey(), entry.getValue(), cores[corIdx % cores.length]));
            corIdx++;
        }

        // Top Produtos (Maiores Quantidades)
        List<DashboardMetricsDTO.TopProductDTO> topProducts = todosProdutos.stream()
                .sorted((a, b) -> Integer.compare(b.getQuantidade(), a.getQuantidade()))
                .limit(5)
                .map(p -> new DashboardMetricsDTO.TopProductDTO(p.getNome() != null && !p.getNome().isEmpty() ? p.getNome() : p.getCodigo(), p.getQuantidade()))
                .collect(Collectors.toList());

        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM HH:mm");
        List<DashboardMetricsDTO.LogItemDTO> logs = logRepository.findTop20ByOrderByTimestampDesc().stream()
            .map(log -> {
                String operator = "Sistema"; // O sistema atual não tem auth de usuário ainda
                String action = log.getTipo().name().equals("LOGISTICA") ? "Mover" : log.getTipo().name();
                String product = "-";
                if (log.getMovimentacao() != null && log.getMovimentacao().getProduto() != null) {
                    product = log.getMovimentacao().getProduto().getNome() != null ? log.getMovimentacao().getProduto().getNome() : log.getMovimentacao().getProduto().getCodigo();
                } else if (log.getMensagem() != null && !log.getMensagem().isEmpty()) {
                    product = log.getMensagem().length() > 20 ? log.getMensagem().substring(0, 20) + "..." : log.getMensagem();
                }
                String position = log.getEstante() != null ? log.getEstante().getNome() : "-";
                String status = log.getTipo().name().equals("ERRO") ? "FALHA" : "SUCESSO";
                String time = log.getTimestamp() != null ? log.getTimestamp().format(formatter) : "agora";

                return new DashboardMetricsDTO.LogItemDTO(log.getId(), operator, action, product, position, status, time);
            })
            .collect(Collectors.toList());

        return new DashboardMetricsDTO(kpis, categorias, storage, topProducts, logs);
    }
}
