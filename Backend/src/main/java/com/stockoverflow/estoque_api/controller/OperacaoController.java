package com.stockoverflow.estoque_api.controller;

import com.stockoverflow.estoque_api.dto.GuardarProdutoRequest;
import com.stockoverflow.estoque_api.dto.RetirarProdutoRequest;
import com.stockoverflow.estoque_api.dto.OperacaoResponse;
import com.stockoverflow.estoque_api.service.OperacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller expondo as APIs para operações de guardar, retirar e parar robô.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class OperacaoController {

    private final OperacaoService operacaoService;

    /**
     * Rota POST /api/guardar
     */
    @PostMapping("/guardar")
    public ResponseEntity<OperacaoResponse> guardar(@Valid @RequestBody GuardarProdutoRequest request) {
        OperacaoResponse response = operacaoService.guardar(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Rota POST /api/retirar
     */
    @PostMapping("/retirar")
    public ResponseEntity<OperacaoResponse> retirar(@Valid @RequestBody RetirarProdutoRequest request) {
        OperacaoResponse response = operacaoService.retirar(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Rota POST /api/pararRobo
     */
    @PostMapping("/pararRobo")
    public ResponseEntity<?> pararRobo() {
        operacaoService.pararRobo();
        return ResponseEntity.ok(Map.of(
                "status", "sucesso",
                "mensagem", "Comando stopRobot enviado com sucesso"
        ));
    }
}
