package com.bussvdn.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "VeLuot")
public class VeLuot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaVeLuot")
    private Integer maVeLuot;

    @Column(name = "MaSinhVien")
    private String maSinhVien;

    @Column(name = "MaTuyen")
    private Integer maTuyen;

    @Column(name = "MaTramLen")
    private Integer maTramLen;

    @Column(name = "MaTramXuong")
    private Integer maTramXuong;

    @Column(name = "MaChuyenXe")
    private Integer maChuyenXe;

    @Column(name = "MaQR")
    private String maQr;

    @Column(name = "NgayHetHan")
    private LocalDateTime ngayHetHan;

    @Column(name = "LanQuetCuoi")
    private LocalDateTime lanQuetCuoi;

    @Column(name = "MaPhuXeQuet")
    private Integer maPhuXeQuet;

    @Column(name = "TrangThai")
    private String trangThai;

    public Integer getMaVeLuot() { return maVeLuot; }
    public String getMaSinhVien() { return maSinhVien; }
    public Integer getMaTuyen() { return maTuyen; }
    public Integer getMaTramLen() { return maTramLen; }
    public Integer getMaTramXuong() { return maTramXuong; }
    public Integer getMaChuyenXe() { return maChuyenXe; }
    public String getMaQr() { return maQr; }
    public LocalDateTime getNgayHetHan() { return ngayHetHan; }
    public String getTrangThai() { return trangThai; }
    public void setMaChuyenXe(Integer maChuyenXe) { this.maChuyenXe = maChuyenXe; }
    public void setLanQuetCuoi(LocalDateTime lanQuetCuoi) { this.lanQuetCuoi = lanQuetCuoi; }
    public void setMaPhuXeQuet(Integer maPhuXeQuet) { this.maPhuXeQuet = maPhuXeQuet; }
    public void setTrangThai(String trangThai) { this.trangThai = trangThai; }
}
