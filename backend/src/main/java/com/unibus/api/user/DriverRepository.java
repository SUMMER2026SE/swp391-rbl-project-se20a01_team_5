package com.unibus.api.user;

import org.springframework.data.jpa.repository.JpaRepository;
import com.unibus.api.user.model.Driver;

public interface DriverRepository extends JpaRepository<Driver, Integer> {
}
