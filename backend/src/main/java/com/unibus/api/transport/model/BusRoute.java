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
@Table(name = "routes")
@Getter
@Setter
@NoArgsConstructor
public class BusRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "route_id")
    private Integer id;

    @Column(name = "route_name", nullable = false, length = 150)
    private String routeName;

    @Column(name = "route_code", length = 30)
    private String routeCode;

    @Column(length = 500)
    private String description;

    @Column(name = "distance_km")
    private BigDecimal distanceKm;

    @Column(name = "estimated_minutes")
    private Integer estimatedMinutes;

    @Column(name = "frequency_min")
    private Integer frequencyMin;

    @Column(name = "color_hex", length = 20)
    private String colorHex;

    @Column(name = "external_source", length = 40)
    private String externalSource;

    @Column(name = "external_route_id", length = 80)
    private String externalRouteId;

    @Column(name = "source_updated_at")
    private OffsetDateTime sourceUpdatedAt;

    @Column(name = "is_interregional", nullable = false, columnDefinition = "boolean default false")
    private boolean interregional;

    @Column(name = "is_circular", nullable = false)
    private boolean circular;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RouteStatus status;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
}
