package com.stockoverflow.estoque_api.config;

import com.stockoverflow.estoque_api.model.*;
import com.stockoverflow.estoque_api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ArmazemRepository armazemRepository;
    private final EstanteRepository estanteRepository;
    private final RobotRepository robotRepository;
    private final ProdutoRepository produtoRepository;
    private final LogRepository logRepository;

    @Override
    public void run(String... args) throws Exception {
        if (armazemRepository.count() == 0) {
            System.out.println("🌱 Banco de dados vazio! Iniciando população de dados de teste...");

            // 1. Criar Armazém
            Armazem armazem = Armazem.builder()
                    .nome("Armazém Central")
                    .build();
            armazem = armazemRepository.save(armazem);

            // 2. Criar Robôs (inicialmente sem produto atual)
            Robot robot1 = Robot.builder()
                    .id("ROB-01")
                    .status(RobotStatus.EM_MOVIMENTO)
                    .build();
            robot1 = robotRepository.save(robot1);

            Robot robot2 = Robot.builder()
                    .id("ROB-02")
                    .status(RobotStatus.AGUARDANDO)
                    .build();
            robot2 = robotRepository.save(robot2);

            // 3. Criar Estantes associadas ao Armazém e aos Robôs
            Estante estante1 = Estante.builder()
                    .id("EST-01")
                    .nome("Estante A")
                    .capacidadeMaxima(100)
                    .capacidadeAtual(65)
                    .armazem(armazem)
                    .robot(robot1)
                    .build();
            estante1 = estanteRepository.save(estante1);

            Estante estante2 = Estante.builder()
                    .id("EST-02")
                    .nome("Estante B")
                    .capacidadeMaxima(150)
                    .capacidadeAtual(80)
                    .armazem(armazem)
                    .robot(robot2)
                    .build();
            estante2 = estanteRepository.save(estante2);

            // 4. Criar Produtos associados às Estantes
            Produto prod1 = Produto.builder()
                    .nome("Parafuso de Aço")
                    .quantidade(50)
                    .estante(estante1)
                    .build();
            prod1 = produtoRepository.save(prod1);

            Produto prod2 = Produto.builder()
                    .nome("Prego Galvanizado")
                    .quantidade(15)
                    .estante(estante1)
                    .build();
            prod2 = produtoRepository.save(prod2);

            Produto prod3 = Produto.builder()
                    .nome("Arruela Zincada")
                    .quantidade(80)
                    .estante(estante2)
                    .build();
            prod3 = produtoRepository.save(prod3);

            // 5. Associar Produto Atual ao Robô 1
            robot1.setProdutoAtual(prod1);
            robotRepository.save(robot1);

            // 6. Criar Logs Históricos
            Log log1 = Log.builder()
                    .timestamp(LocalDateTime.now().minusMinutes(10))
                    .tipo(TipoLog.LOGISTICA)
                    .mensagem("Robô iniciou movimentação do produto Parafuso de Aço")
                    .estante(estante1)
                    .robot(robot1)
                    .build();
            logRepository.save(log1);

            Log log2 = Log.builder()
                    .timestamp(LocalDateTime.now().minusMinutes(2))
                    .tipo(TipoLog.LOGISTICA)
                    .mensagem("Robô ROB-01 transportando Parafuso de Aço na Estante A")
                    .estante(estante1)
                    .robot(robot1)
                    .build();
            logRepository.save(log2);

            System.out.println("🌱 População de dados concluída com sucesso!");
        } else {
            System.out.println("🌱 Banco de dados já possui dados, pulando seeding.");
        }
    }
}
