package com.unibus.api.transport.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import lombok.Generated;

@Entity
@Table(
   name = "routes"
)
public class BusRoute {
   @Id
   @GeneratedValue(
      strategy = GenerationType.IDENTITY
   )
   @Column(
      name = "route_id"
   )
   private Integer id;
   @Column(
      name = "route_name",
      nullable = false,
      length = 150
   )
   private String routeName;
   @Column(
      length = 500
   )
   private String description;
   @Column(
      name = "distance_km"
   )
   private BigDecimal distanceKm;
   @Column(
      name = "estimated_minutes"
   )
   private Integer estimatedMinutes;
   @Column(
      name = "is_circular",
      nullable = false
   )
   private boolean circular;
   @Enumerated(EnumType.STRING)
   @Column(
      nullable = false,
      length = 20
   )
   private RouteStatus status;
   @Column(
      name = "created_at",
      nullable = false
   )
   private OffsetDateTime createdAt;

   @Generated
   public Integer getId() {
      return this.id;
   }

   @Generated
   public String getRouteName() {
      return this.routeName;
   }

   @Generated
   public String getDescription() {
      return this.description;
   }

   @Generated
   public BigDecimal getDistanceKm() {
      return this.distanceKm;
   }

   @Generated
   public Integer getEstimatedMinutes() {
      return this.estimatedMinutes;
   }

   @Generated
   public boolean isCircular() {
      return this.circular;
   }

   @Generated
   public RouteStatus getStatus() {
      return this.status;
   }

   @Generated
   public OffsetDateTime getCreatedAt() {
      return this.createdAt;
   }

   @Generated
   public void setId(final Integer id) {
      this.id = id;
   }

   @Generated
   public void setRouteName(final String routeName) {
      this.routeName = routeName;
   }

   @Generated
   public void setDescription(final String description) {
      this.description = description;
   }

   @Generated
   public void setDistanceKm(final BigDecimal distanceKm) {
      this.distanceKm = distanceKm;
   }

   @Generated
   public void setEstimatedMinutes(final Integer estimatedMinutes) {
      this.estimatedMinutes = estimatedMinutes;
   }

   @Generated
   public void setCircular(final boolean circular) {
      this.circular = circular;
   }

   @Generated
   public void setStatus(final RouteStatus status) {
      this.status = status;
   }

   @Generated
   public void setCreatedAt(final OffsetDateTime createdAt) {
      this.createdAt = createdAt;
   }
}
