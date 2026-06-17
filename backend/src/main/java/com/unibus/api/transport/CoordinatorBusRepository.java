package com.unibus.api.transport;

import com.unibus.api.transport.model.Bus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CoordinatorBusRepository extends JpaRepository<Bus, Integer> {
}
