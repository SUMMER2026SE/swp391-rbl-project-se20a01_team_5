package com.bussvdn.backend.repository;

import com.bussvdn.backend.entity.TuyenTram;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TuyenTramRepository extends JpaRepository<TuyenTram, Integer> {
    @EntityGraph(attributePaths = {"tramDung"})
    List<TuyenTram> findByTuyenXeMaTuyenOrderByThuTuAsc(Integer maTuyen);
}
