package com.Thitas.estoque_api.repository;

import com.Thitas.estoque_api.model.Armazem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArmazemRepository extends JpaRepository<Armazem, String> {
}
