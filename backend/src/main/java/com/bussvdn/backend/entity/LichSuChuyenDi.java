package com.bussvdn.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "LichSuChuyenDi")
public class LichSuChuyenDi {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaLichSu")
    private Integer maLichSu;

    @Column(name = "MaSinhVien")
    private String maSinhVien;

    @Column(name = "MaChuyenXe")
    private Integer maChuyenXe;

    @Column(name = "MaTramLen")
    private Integer maTramLen;

    @Column(name = "MaTramXuong")
    private Integer maTramXuong;

    @Column(name = "ThoiGianLen")
    private LocalDateTime thoiGianLen;

    @Column(name = "PhuongThucXacNhan")
    private String phuongThucXacNhan;

    @Column(name = "MaPhuXeXacNhan")
    private Integer maPhuXeXacNhan;

    public void setMaSinhVien(String maSinhVien) { this.maSinhVien = maSinhVien; }
    public void setMaChuyenXe(Integer maChuyenXe) { this.maChuyenXe = maChuyenXe; }
    public void setMaTramLen(Integer maTramLen) { this.maTramLen = maTramLen; }
    public void setMaTramXuong(Integer maTramXuong) { this.maTramXuong = maTramXuong; }
    public void setThoiGianLen(LocalDateTime thoiGianLen) { this.thoiGianLen = thoiGianLen; }
    public void setPhuongThucXacNhan(String phuongThucXacNhan) { this.phuongThucXacNhan = phuongThucXacNhan; }
    public void setMaPhuXeXacNhan(Integer maPhuXeXacNhan) { this.maPhuXeXacNhan = maPhuXeXacNhan; }
}
