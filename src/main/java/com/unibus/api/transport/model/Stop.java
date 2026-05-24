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
   name = "stops"
)
public class Stop {
   @Id
   @GeneratedValue(
      strategy = GenerationType.IDENTITY
   )
   @Column(
      name = "stop_id"
   )
   private Integer id;
   @Column(
      name = "stop_name",
      nullable = false,
      length = 150
   )
   private String stopName;
   private String address;
   private BigDecimal longitude;
   private BigDecimal latitude;
   @Column(
      length = 500
   )
   private String description;
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
   public String getStopName() {
      return this.stopName;
   }

   @Generated
   public String getAddress() {
      return this.address;
   }

   @Generated
   public BigDecimal getLongitude() {
      return this.longitude;
   }

   @Generated
   public BigDecimal getLatitude() {
      return this.latitude;
   }

   @Generated
   public String getDescription() {
      return this.description;
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
   public void setStopName(final String stopName) {
      this.stopName = stopName;
   }

   @Generated
   public void setAddress(final String address) {
      this.address = address;
   }

   @Generated
   public void setLongitude(final BigDecimal longitude) {
      this.longitude = longitude;
   }

   @Generated
   public void setLatitude(final BigDecimal latitude) {
      this.latitude = latitude;
   }

   @Generated
   public void setDescription(final String description) {
      this.description = description;
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
