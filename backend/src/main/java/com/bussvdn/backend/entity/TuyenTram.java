package com.bussvdn.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "TuyenTram")
public class TuyenTram {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaTuyenTram")
    private Integer maTuyenTram;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaTuyen")
    private TuyenXe tuyenXe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaTram")
    private TramDung tramDung;

    @Column(name = "ThuTu")
    private Integer thuTu;

    @Column(name = "ThoiGianDuKien")
    private Integer thoiGianDuKien;

    public Integer getMaTuyenTram() { return maTuyenTram; }
    public TuyenXe getTuyenXe() { return tuyenXe; }
    public TramDung getTramDung() { return tramDung; }
    public Integer getThuTu() { return thuTu; }
    public Integer getThoiGianDuKien() { return thoiGianDuKien; }
}
