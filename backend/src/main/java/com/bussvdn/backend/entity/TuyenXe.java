package com.bussvdn.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "TuyenXe")
public class TuyenXe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaTuyen")
    private Integer maTuyen;

    @Column(name = "TenTuyen")
    private String tenTuyen;

    @Column(name = "MoTa")
    private String moTa;

    @Column(name = "KhoangCach")
    private BigDecimal khoangCach;

    @Column(name = "ThoiGianDuKien")
    private Integer thoiGianDuKien;

    @Column(name = "TrangThai")
    private String trangThai;

    public Integer getMaTuyen() { return maTuyen; }
    public String getTenTuyen() { return tenTuyen; }
    public String getMoTa() { return moTa; }
    public BigDecimal getKhoangCach() { return khoangCach; }
    public Integer getThoiGianDuKien() { return thoiGianDuKien; }
    public String getTrangThai() { return trangThai; }
}
