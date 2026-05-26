package com.Thitas.estoque_api.repository;

import com.Thitas.estoque_api.model.Robot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RobotRepository extends JpaRepository<Robot, String> {
}
