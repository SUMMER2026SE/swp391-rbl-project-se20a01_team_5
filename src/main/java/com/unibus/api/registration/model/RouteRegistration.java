package com.unibus.api.registration.model;

import com.unibus.api.transport.model.BusRoute;
import com.unibus.api.transport.model.Stop;
import com.unibus.api.user.model.Student;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.Generated;

@Entity
@Table(
   name = "route_registrations"
)
public class RouteRegistration {
   @Id
   @GeneratedValue(
      strategy = GenerationType.IDENTITY
   )
   @Column(
      name = "registration_id"
   )
   private Integer id;
   @ManyToOne(
      fetch = FetchType.LAZY,
      optional = false
   )
   @JoinColumn(
      name = "student_code",
      nullable = false
   )
   private Student student;
   @ManyToOne(
      fetch = FetchType.LAZY,
      optional = false
   )
   @JoinColumn(
      name = "route_id",
      nullable = false
   )
   private BusRoute route;
   @ManyToOne(
      fetch = FetchType.LAZY
   )
   @JoinColumn(
      name = "boarding_stop_id"
   )
   private Stop boardingStop;
   @ManyToOne(
      fetch = FetchType.LAZY
   )
   @JoinColumn(
      name = "alighting_stop_id"
   )
   private Stop alightingStop;
   @Column(
      name = "registered_at",
      nullable = false
   )
   private OffsetDateTime registeredAt;
   @Column(
      name = "effective_date"
   )
   private LocalDate effectiveDate;
   @Enumerated(EnumType.STRING)
   @Column(
      nullable = false,
      length = 20
   )
   private RegistrationStatus status;
   @ManyToOne(
      fetch = FetchType.LAZY
   )
   @JoinColumn(
      name = "previous_registration_id"
   )
   private RouteRegistration previousRegistration;
   @Column(
      name = "cancellation_reason",
      length = 500
   )
   private String cancellationReason;
   @Column(
      name = "approved_at"
   )
   private OffsetDateTime approvedAt;

   @Generated
   public Integer getId() {
      return this.id;
   }

   @Generated
   public Student getStudent() {
      return this.student;
   }

   @Generated
   public BusRoute getRoute() {
      return this.route;
   }

   @Generated
   public Stop getBoardingStop() {
      return this.boardingStop;
   }

   @Generated
   public Stop getAlightingStop() {
      return this.alightingStop;
   }

   @Generated
   public OffsetDateTime getRegisteredAt() {
      return this.registeredAt;
   }

   @Generated
   public LocalDate getEffectiveDate() {
      return this.effectiveDate;
   }

   @Generated
   public RegistrationStatus getStatus() {
      return this.status;
   }

   @Generated
   public RouteRegistration getPreviousRegistration() {
      return this.previousRegistration;
   }

   @Generated
   public String getCancellationReason() {
      return this.cancellationReason;
   }

   @Generated
   public OffsetDateTime getApprovedAt() {
      return this.approvedAt;
   }

   @Generated
   public void setId(final Integer id) {
      this.id = id;
   }

   @Generated
   public void setStudent(final Student student) {
      this.student = student;
   }

   @Generated
   public void setRoute(final BusRoute route) {
      this.route = route;
   }

   @Generated
   public void setBoardingStop(final Stop boardingStop) {
      this.boardingStop = boardingStop;
   }

   @Generated
   public void setAlightingStop(final Stop alightingStop) {
      this.alightingStop = alightingStop;
   }

   @Generated
   public void setRegisteredAt(final OffsetDateTime registeredAt) {
      this.registeredAt = registeredAt;
   }

   @Generated
   public void setEffectiveDate(final LocalDate effectiveDate) {
      this.effectiveDate = effectiveDate;
   }

   @Generated
   public void setStatus(final RegistrationStatus status) {
      this.status = status;
   }

   @Generated
   public void setPreviousRegistration(final RouteRegistration previousRegistration) {
      this.previousRegistration = previousRegistration;
   }

   @Generated
   public void setCancellationReason(final String cancellationReason) {
      this.cancellationReason = cancellationReason;
   }

   @Generated
   public void setApprovedAt(final OffsetDateTime approvedAt) {
      this.approvedAt = approvedAt;
   }
}
