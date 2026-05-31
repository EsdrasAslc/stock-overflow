package com.stockoverflow.estoque_api.repository;

import com.stockoverflow.estoque_api.model.RobotMoviment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RobotMovimentRepository extends JpaRepository<RobotMoviment, String> {
    List<RobotMoviment> findByRobotId(String robotId);
}
