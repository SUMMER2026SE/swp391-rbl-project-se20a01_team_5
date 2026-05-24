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
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ChuyenXe")
public class ChuyenXe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaChuyenXe")
    private Integer maChuyenXe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaLichTrinh")
    private LichTrinhXe lichTrinhXe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaTuyen")
    private TuyenXe tuyenXe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaXe")
    private XeBus xeBus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaTaiXe")
    private TaiXe taiXe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaPhuXe")
    private PhuXe phuXe;

    @Column(name = "NgayChay")
    private LocalDate ngayChay;

    @Column(name = "GioKhoiHanh")
    private LocalDateTime gioKhoiHanh;

    @Column(name = "GioKetThuc")
    private LocalDateTime gioKetThuc;

    @Column(name = "TrangThai")
    private String trangThai;

    @Column(name = "GhiChu")
    private String ghiChu;

    public Integer getMaChuyenXe() { return maChuyenXe; }
    public LichTrinhXe getLichTrinhXe() { return lichTrinhXe; }
    public TuyenXe getTuyenXe() { return tuyenXe; }
    public XeBus getXeBus() { return xeBus; }
    public TaiXe getTaiXe() { return taiXe; }
    public PhuXe getPhuXe() { return phuXe; }
    public LocalDate getNgayChay() { return ngayChay; }
    public LocalDateTime getGioKhoiHanh() { return gioKhoiHanh; }
    public LocalDateTime getGioKetThuc() { return gioKetThuc; }
    public String getTrangThai() { return trangThai; }
    public String getGhiChu() { return ghiChu; }
    public void setGioKhoiHanh(LocalDateTime gioKhoiHanh) { this.gioKhoiHanh = gioKhoiHanh; }
    public void setGioKetThuc(LocalDateTime gioKetThuc) { this.gioKetThuc = gioKetThuc; }
    public void setTrangThai(String trangThai) { this.trangThai = trangThai; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }
}
