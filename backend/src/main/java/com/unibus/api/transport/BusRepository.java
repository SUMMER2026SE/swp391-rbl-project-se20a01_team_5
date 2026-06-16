package com.unibus.api.transport;

import org.springframework.data.jpa.repository.JpaRepository;

import com.unibus.api.transport.model.Bus;

public interface BusRepository extends JpaRepository<Bus, Integer> {
}
