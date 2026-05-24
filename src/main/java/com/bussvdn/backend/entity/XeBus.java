package com.bussvdn.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "XeBus")
public class XeBus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaXe")
    private Integer maXe;

    @Column(name = "BienSo")
    private String bienSo;

    @Column(name = "SoChoNgoi")
    private Integer soChoNgoi;

    @Column(name = "LoaiXe")
    private String loaiXe;

    @Column(name = "TrangThai")
    private String trangThai;

    public Integer getMaXe() { return maXe; }
    public String getBienSo() { return bienSo; }
    public Integer getSoChoNgoi() { return soChoNgoi; }
    public String getLoaiXe() { return loaiXe; }
    public String getTrangThai() { return trangThai; }
    public void setTrangThai(String trangThai) { this.trangThai = trangThai; }
}
