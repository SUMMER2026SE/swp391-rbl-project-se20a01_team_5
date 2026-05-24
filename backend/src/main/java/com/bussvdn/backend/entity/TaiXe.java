package com.bussvdn.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "TaiXe")
public class TaiXe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaTaiXe")
    private Integer maTaiXe;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaNguoiDung", nullable = false)
    private NguoiDung nguoiDung;

    @Column(name = "MaGiayPhep")
    private String maGiayPhep;

    @Column(name = "SoNamKinhNghiem")
    private Integer soNamKinhNghiem;

    @Column(name = "DanhGiaTrungBinh")
    private BigDecimal danhGiaTrungBinh;

    @Column(name = "TrangThaiHoatDong")
    private String trangThaiHoatDong;

    public Integer getMaTaiXe() { return maTaiXe; }
    public NguoiDung getNguoiDung() { return nguoiDung; }
    public String getMaGiayPhep() { return maGiayPhep; }
    public Integer getSoNamKinhNghiem() { return soNamKinhNghiem; }
    public BigDecimal getDanhGiaTrungBinh() { return danhGiaTrungBinh; }
    public String getTrangThaiHoatDong() { return trangThaiHoatDong; }
    public void setTrangThaiHoatDong(String trangThaiHoatDong) { this.trangThaiHoatDong = trangThaiHoatDong; }
}
