package com.unibus.api.driver;

import com.unibus.api.driver.model.Driver;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DriverRepository extends JpaRepository<Driver, Integer> {

    @EntityGraph(attributePaths = "user")
    Optional<Driver> findByUserId(Integer userId);
}
