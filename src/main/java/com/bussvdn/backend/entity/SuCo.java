package com.bussvdn.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "SuCo")
public class SuCo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaSuCo")
    private Integer maSuCo;

    @Column(name = "MaPhuXe")
    private Integer maPhuXe;

    @Column(name = "MaChuyenXe")
    private Integer maChuyenXe;

    @Column(name = "LoaiSuCo")
    private String loaiSuCo;

    @Column(name = "MoTa")
    private String moTa;

    @Column(name = "NgayBaoCao")
    private LocalDateTime ngayBaoCao;

    @Column(name = "TrangThai")
    private String trangThai;

    public Integer getMaSuCo() { return maSuCo; }
    public void setMaPhuXe(Integer maPhuXe) { this.maPhuXe = maPhuXe; }
    public void setMaChuyenXe(Integer maChuyenXe) { this.maChuyenXe = maChuyenXe; }
    public void setLoaiSuCo(String loaiSuCo) { this.loaiSuCo = loaiSuCo; }
    public void setMoTa(String moTa) { this.moTa = moTa; }
    public void setNgayBaoCao(LocalDateTime ngayBaoCao) { this.ngayBaoCao = ngayBaoCao; }
    public void setTrangThai(String trangThai) { this.trangThai = trangThai; }
}
