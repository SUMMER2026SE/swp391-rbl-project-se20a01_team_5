package com.unibus.api.user;

import com.unibus.api.user.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CoordinatorDriverRepository extends JpaRepository<Driver, Integer> {
}
