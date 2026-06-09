package com.stockoverflow.estoque_api.service;

import com.stockoverflow.estoque_api.dto.UsuarioRequestDTO;
import com.stockoverflow.estoque_api.dto.UsuarioResponseDTO;
import com.stockoverflow.estoque_api.model.Usuario;
import com.stockoverflow.estoque_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository repository;

    public List<UsuarioResponseDTO> listarTodos() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    public UsuarioResponseDTO buscarPorId(String id) {
        Usuario usuario = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        return toDTO(usuario);
    }

    public UsuarioResponseDTO criar(UsuarioRequestDTO dto) {
        if (repository.findByCpf(dto.cpf()).isPresent()) {
            throw new RuntimeException("Já existe um usuário com o CPF: " + dto.cpf());
        }
        Usuario usuario = Usuario.builder()
                .nome(dto.nome())
                .user(dto.user())
                .cpf(dto.cpf())
                .password(dto.password())
                .role(dto.role())
                .build();
        return toDTO(repository.save(usuario));
    }

    public UsuarioResponseDTO login(com.stockoverflow.estoque_api.dto.LoginRequestDTO dto) {
        Usuario usuario = repository.findByUser(dto.user())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        if (!usuario.getPassword().equals(dto.password())) {
            throw new RuntimeException("Senha incorreta");
        }
        return toDTO(usuario);
    }

    public UsuarioResponseDTO atualizar(String id, UsuarioRequestDTO dto) {
        Usuario usuario = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        usuario.setNome(dto.nome());
        usuario.setUser(dto.user());
        usuario.setPassword(dto.password());
        usuario.setRole(dto.role());
        usuario.setCpf(dto.cpf());
        return toDTO(repository.save(usuario));
    }

    public void deletar(String id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Usuário não encontrado");
        }
        repository.deleteById(id);
    }

    public UsuarioResponseDTO buscarPorCpf(UsuarioRequestDTO dto) {
        Usuario usuario = repository.findByCpf(dto.cpf())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        return toDTO(usuario);
    }

    public UsuarioResponseDTO toDTO(Usuario usuario) {
        if (usuario == null)
            return null;
        return new UsuarioResponseDTO(
                
                usuario.getNome(),
                usuario.getUser(),
                usuario.getRole() != null ? usuario.getRole().name() : null);
    }
}
