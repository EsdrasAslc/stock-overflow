package com.Thitas.estoque_api.repository;

import com.Thitas.estoque_api.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProdutoRepository extends JpaRepository<Produto, String> {
    List<Produto> findByEstanteId(String estanteId);
}
