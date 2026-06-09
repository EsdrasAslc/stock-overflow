package com.stockoverflow.estoque_api.repository;

import com.stockoverflow.estoque_api.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, String> {
    Optional<Usuario> findByCpf(String cpf);
    Optional<Usuario> findByUser(String user);
}
