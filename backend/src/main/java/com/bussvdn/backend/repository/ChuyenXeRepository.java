package com.bussvdn.backend.repository;

import com.bussvdn.backend.entity.ChuyenXe;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChuyenXeRepository extends JpaRepository<ChuyenXe, Integer> {
    @EntityGraph(attributePaths = {"lichTrinhXe", "tuyenXe", "xeBus", "taiXe.nguoiDung", "phuXe.nguoiDung"})
    List<ChuyenXe> findByTaiXeMaTaiXeAndNgayChayBetweenOrderByNgayChayAscGioKhoiHanhAsc(
            Integer maTaiXe, LocalDate from, LocalDate to);

    @EntityGraph(attributePaths = {"lichTrinhXe", "tuyenXe", "xeBus", "taiXe.nguoiDung", "phuXe.nguoiDung"})
    List<ChuyenXe> findByPhuXeMaPhuXeAndNgayChayBetweenOrderByNgayChayAscGioKhoiHanhAsc(
            Integer maPhuXe, LocalDate from, LocalDate to);
}
