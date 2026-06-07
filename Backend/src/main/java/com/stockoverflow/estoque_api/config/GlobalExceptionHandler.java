package com.stockoverflow.estoque_api.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Capturador global de exceções para a API REST.
 * Intercepta erros lançados nos controllers/services e formata respostas JSON estruturadas.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Trata erros de validação de DTOs (campos marcados com @NotBlank, @NotNull, etc).
     * Retorna HTTP 400 (Bad Request) com a lista detalhada de campos inválidos.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Erro de Validação");
        body.put("details", errors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * Trata exceções de argumentos inválidos passados aos métodos.
     * Retorna HTTP 400 (Bad Request).
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Argumento Inválido");
        body.put("message", ex.getMessage());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * Trata RuntimeExceptions gerais lançadas pelas regras de negócio.
     * Se a mensagem contiver "não encontrado", responde com HTTP 404 (Not Found).
     * Caso contrário, responde com HTTP 400 ou 500 conforme o tipo de mensagem.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String errorName = "Erro Interno do Servidor";

        String msg = ex.getMessage();
        if (msg != null) {
            String lowerMsg = msg.toLowerCase();
            // Mapeamento pragmático de recursos não encontrados no banco
            if (lowerMsg.contains("não encontrad") || lowerMsg.contains("nenhum log")) {
                status = HttpStatus.NOT_FOUND;
                errorName = "Recurso Não Encontrado";
            }
            // Mapeamento de regras de negócios violadas (ex: registros duplicados, offline)
            else if (lowerMsg.contains("já existe") || lowerMsg.contains("não está conectado") || lowerMsg.contains("não respondeu")) {
                status = HttpStatus.BAD_REQUEST;
                errorName = "Regra de Negócio Violada";
            }
        }

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", errorName);
        body.put("message", msg);

        return ResponseEntity.status(status).body(body);
    }

    /**
     * Capturador de fallback para qualquer exceção não tratada explicitamente acima.
     * Retorna HTTP 500 (Internal Server Error).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("error", "Erro Inesperado");
        body.put("message", ex.getMessage());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
