package com.bussvdn.backend.repository;

import com.bussvdn.backend.entity.PhuXe;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhuXeRepository extends JpaRepository<PhuXe, Integer> {
    Optional<PhuXe> findByNguoiDungMaNguoiDung(Integer maNguoiDung);
}
