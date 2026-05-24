package com.bussvdn.backend.repository;

import com.bussvdn.backend.entity.VeLuot;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VeLuotRepository extends JpaRepository<VeLuot, Integer> {
    Optional<VeLuot> findByMaQr(String maQr);
}
