package com.stockoverflow.estoque_api.repository;

import com.stockoverflow.estoque_api.model.Armazem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArmazemRepository extends JpaRepository<Armazem, String> {
}
