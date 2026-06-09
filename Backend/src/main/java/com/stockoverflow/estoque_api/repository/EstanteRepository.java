package com.stockoverflow.estoque_api.repository;

import com.stockoverflow.estoque_api.model.Estante;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EstanteRepository extends JpaRepository<Estante, String> {
    List<Estante> findByArmazemId(String armazemId);
    java.util.Optional<Estante> findByNome(String nome);
}
