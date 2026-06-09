package com.stockoverflow.estoque_api.repository;

import com.stockoverflow.estoque_api.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProdutoRepository extends JpaRepository<Produto, String> {
    List<Produto> findByEstanteId(String estanteId);
    List<Produto> findByCodigo(String codigo);
    java.util.Optional<Produto> findByCodigoAndEstanteNome(String codigo, String estanteNome);
}
