package com.bussvdn.backend.repository;

import com.bussvdn.backend.entity.LichTrinhXe;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LichTrinhXeRepository extends JpaRepository<LichTrinhXe, Integer> {
    @EntityGraph(attributePaths = {"tuyenXe", "xeBus", "phuXe.nguoiDung"})
    List<LichTrinhXe> findByTaiXeMaTaiXeAndTrangThaiOrderByNgayTrongTuanAscGioKhoiHanhAsc(
            Integer maTaiXe, String trangThai);
}
