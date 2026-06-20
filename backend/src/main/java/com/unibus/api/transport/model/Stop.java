package com.unibus.api.transport.model;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "stops")
@Getter
@Setter
@NoArgsConstructor
public class Stop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stop_id")
    private Integer id;

    @Column(name = "stop_name", nullable = false, length = 150)
    private String stopName;

    @Column(name = "stop_code", length = 30)
    private String stopCode;

    private String address;

    private BigDecimal longitude;

    private BigDecimal latitude;

    @Column(name = "has_shelter", nullable = false)
    private boolean hasShelter;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RouteStatus status;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
}
