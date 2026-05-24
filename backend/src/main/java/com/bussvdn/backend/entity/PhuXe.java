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

@Entity
@Table(name = "PhuXe")
public class PhuXe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaPhuXe")
    private Integer maPhuXe;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaNguoiDung", nullable = false)
    private NguoiDung nguoiDung;

    @Column(name = "MaNhanVien")
    private String maNhanVien;

    public Integer getMaPhuXe() { return maPhuXe; }
    public NguoiDung getNguoiDung() { return nguoiDung; }
    public String getMaNhanVien() { return maNhanVien; }
}
