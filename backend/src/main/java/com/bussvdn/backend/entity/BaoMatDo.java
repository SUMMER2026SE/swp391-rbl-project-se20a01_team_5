package com.bussvdn.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "BaoMatDo")
public class BaoMatDo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaBaoMatDo")
    private Integer maBaoMatDo;

    @Column(name = "MaNguoiBao")
    private Integer maNguoiBao;

    @Column(name = "MaChuyenXe")
    private Integer maChuyenXe;

    @Column(name = "MoTaMonDo")
    private String moTaMonDo;

    @Column(name = "NgayBao")
    private LocalDateTime ngayBao;

    @Column(name = "TrangThai")
    private String trangThai;

    @Column(name = "GhiChu")
    private String ghiChu;

    @Column(name = "MaNguoiHoTro")
    private Integer maNguoiHoTro;

    public Integer getMaBaoMatDo() { return maBaoMatDo; }
    public void setMaNguoiBao(Integer maNguoiBao) { this.maNguoiBao = maNguoiBao; }
    public void setMaChuyenXe(Integer maChuyenXe) { this.maChuyenXe = maChuyenXe; }
    public void setMoTaMonDo(String moTaMonDo) { this.moTaMonDo = moTaMonDo; }
    public void setNgayBao(LocalDateTime ngayBao) { this.ngayBao = ngayBao; }
    public void setTrangThai(String trangThai) { this.trangThai = trangThai; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }
    public void setMaNguoiHoTro(Integer maNguoiHoTro) { this.maNguoiHoTro = maNguoiHoTro; }
}
