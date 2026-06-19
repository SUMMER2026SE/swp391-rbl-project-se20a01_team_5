package com.unibus.api.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.unibus.api.user.model.Conductor;

@Repository
public interface ConductorRepository extends JpaRepository<Conductor, Integer> {
}
