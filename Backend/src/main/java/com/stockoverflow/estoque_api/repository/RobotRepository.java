package com.stockoverflow.estoque_api.repository;

import com.stockoverflow.estoque_api.model.Robot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RobotRepository extends JpaRepository<Robot, String> {
}
