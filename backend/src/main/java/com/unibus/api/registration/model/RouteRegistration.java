package com.unibus.api.registration.model;

import java.time.LocalDate;
import java.time.OffsetDateTime;

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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "route_registrations")
@Getter
@Setter
@NoArgsConstructor
public class RouteRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "registration_id")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_code", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "route_id", nullable = false)
    private BusRoute route;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "boarding_stop_id")
    private Stop boardingStop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alighting_stop_id")
    private Stop alightingStop;

    @Column(name = "registered_at", nullable = false)
    private OffsetDateTime registeredAt;

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RegistrationStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "previous_registration_id")
    private RouteRegistration previousRegistration;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;
}
