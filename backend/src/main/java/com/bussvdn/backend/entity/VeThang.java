package com.bussvdn.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "VeThang")
public class VeThang {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaVeThang")
    private Integer maVeThang;

    @Column(name = "MaSinhVien")
    private String maSinhVien;

    @Column(name = "MaTuyen")
    private Integer maTuyen;

    @Column(name = "NgayHetHan")
    private LocalDate ngayHetHan;

    @Column(name = "MaQR")
    private String maQr;

    @Column(name = "LanQuetCuoi")
    private LocalDateTime lanQuetCuoi;

    @Column(name = "SoLanQuetHomNay")
    private Integer soLanQuetHomNay;

    @Column(name = "TrangThai")
    private String trangThai;

    public Integer getMaVeThang() { return maVeThang; }
    public String getMaSinhVien() { return maSinhVien; }
    public Integer getMaTuyen() { return maTuyen; }
    public LocalDate getNgayHetHan() { return ngayHetHan; }
    public String getMaQr() { return maQr; }
    public LocalDateTime getLanQuetCuoi() { return lanQuetCuoi; }
    public Integer getSoLanQuetHomNay() { return soLanQuetHomNay; }
    public String getTrangThai() { return trangThai; }
    public void setLanQuetCuoi(LocalDateTime lanQuetCuoi) { this.lanQuetCuoi = lanQuetCuoi; }
    public void setSoLanQuetHomNay(Integer soLanQuetHomNay) { this.soLanQuetHomNay = soLanQuetHomNay; }
}
