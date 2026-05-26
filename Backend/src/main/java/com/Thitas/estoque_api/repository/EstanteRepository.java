package com.Thitas.estoque_api.repository;

import com.Thitas.estoque_api.model.Estante;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EstanteRepository extends JpaRepository<Estante, String> {
    List<Estante> findByArmazemId(String armazemId);
}
