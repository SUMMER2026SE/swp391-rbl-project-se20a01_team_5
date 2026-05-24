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
import java.time.LocalTime;

@Entity
@Table(name = "LichTrinhXe")
public class LichTrinhXe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaLichTrinh")
    private Integer maLichTrinh;

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

    @Column(name = "NgayTrongTuan")
    private Integer ngayTrongTuan;

    @Column(name = "GioKhoiHanh")
    private LocalTime gioKhoiHanh;

    @Column(name = "GioKetThuc")
    private LocalTime gioKetThuc;

    @Column(name = "TrangThai")
    private String trangThai;

    @Column(name = "MaNguoiPhanCong")
    private Integer maNguoiPhanCong;

    public Integer getMaLichTrinh() { return maLichTrinh; }
    public TuyenXe getTuyenXe() { return tuyenXe; }
    public XeBus getXeBus() { return xeBus; }
    public TaiXe getTaiXe() { return taiXe; }
    public PhuXe getPhuXe() { return phuXe; }
    public Integer getNgayTrongTuan() { return ngayTrongTuan; }
    public LocalTime getGioKhoiHanh() { return gioKhoiHanh; }
    public LocalTime getGioKetThuc() { return gioKetThuc; }
    public String getTrangThai() { return trangThai; }
    public Integer getMaNguoiPhanCong() { return maNguoiPhanCong; }
}
