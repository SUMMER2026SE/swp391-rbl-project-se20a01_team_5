package com.bussvdn.backend.repository;

import com.bussvdn.backend.entity.TaiXe;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaiXeRepository extends JpaRepository<TaiXe, Integer> {
    Optional<TaiXe> findByNguoiDungMaNguoiDung(Integer maNguoiDung);
}
