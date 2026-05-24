package com.bussvdn.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "TinNhanNoiBo")
public class TinNhanNoiBo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaTinNhan")
    private Long maTinNhan;

    @Column(name = "MaNguoiGui")
    private Integer maNguoiGui;

    @Column(name = "MaNguoiNhan")
    private Integer maNguoiNhan;

    @Column(name = "MaChuyenXe")
    private Integer maChuyenXe;

    @Column(name = "NoiDung")
    private String noiDung;

    @Column(name = "DaDoc")
    private Boolean daDoc;

    @Column(name = "NgayGui")
    private LocalDateTime ngayGui;

    public Long getMaTinNhan() { return maTinNhan; }
    public void setMaNguoiGui(Integer maNguoiGui) { this.maNguoiGui = maNguoiGui; }
    public void setMaNguoiNhan(Integer maNguoiNhan) { this.maNguoiNhan = maNguoiNhan; }
    public void setMaChuyenXe(Integer maChuyenXe) { this.maChuyenXe = maChuyenXe; }
    public void setNoiDung(String noiDung) { this.noiDung = noiDung; }
    public void setDaDoc(Boolean daDoc) { this.daDoc = daDoc; }
    public void setNgayGui(LocalDateTime ngayGui) { this.ngayGui = ngayGui; }
}
