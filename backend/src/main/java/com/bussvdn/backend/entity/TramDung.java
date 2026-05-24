package com.bussvdn.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "TramDung")
public class TramDung {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaTram")
    private Integer maTram;

    @Column(name = "TenTram")
    private String tenTram;

    @Column(name = "DiaChi")
    private String diaChi;

    @Column(name = "KinhDo")
    private BigDecimal kinhDo;

    @Column(name = "ViDo")
    private BigDecimal viDo;

    public Integer getMaTram() { return maTram; }
    public String getTenTram() { return tenTram; }
    public String getDiaChi() { return diaChi; }
    public BigDecimal getKinhDo() { return kinhDo; }
    public BigDecimal getViDo() { return viDo; }
}
