package com.Thitas.estoque_api.repository;

import com.Thitas.estoque_api.model.Log;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LogRepository extends JpaRepository<Log, String> {
    Optional<Log> findFirstByOrderByTimestampDesc();
}
