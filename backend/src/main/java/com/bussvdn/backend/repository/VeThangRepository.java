package com.bussvdn.backend.repository;

import com.bussvdn.backend.entity.VeThang;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VeThangRepository extends JpaRepository<VeThang, Integer> {
    Optional<VeThang> findByMaQr(String maQr);
}
