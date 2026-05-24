package com.bussvdn.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ViTriXe")
public class ViTriXe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaViTri")
    private Long maViTri;

    @Column(name = "MaXe")
    private Integer maXe;

    @Column(name = "MaChuyenXe")
    private Integer maChuyenXe;

    @Column(name = "KinhDo")
    private BigDecimal kinhDo;

    @Column(name = "ViDo")
    private BigDecimal viDo;

    @Column(name = "TocDo")
    private BigDecimal tocDo;

    @Column(name = "ThoiGianCapNhat")
    private LocalDateTime thoiGianCapNhat;

    public void setMaXe(Integer maXe) { this.maXe = maXe; }
    public void setMaChuyenXe(Integer maChuyenXe) { this.maChuyenXe = maChuyenXe; }
    public void setKinhDo(BigDecimal kinhDo) { this.kinhDo = kinhDo; }
    public void setViDo(BigDecimal viDo) { this.viDo = viDo; }
    public void setTocDo(BigDecimal tocDo) { this.tocDo = tocDo; }
    public void setThoiGianCapNhat(LocalDateTime thoiGianCapNhat) { this.thoiGianCapNhat = thoiGianCapNhat; }
}
