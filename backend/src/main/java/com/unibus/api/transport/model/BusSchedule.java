package com.unibus.api.transport.model;

import java.time.LocalTime;
import java.time.OffsetDateTime;

import com.unibus.api.user.model.Driver;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "bus_schedules")
@Getter
@Setter
@NoArgsConstructor
public class BusSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "route_id")
    private BusRoute route;

    @ManyToOne
    @JoinColumn(name = "bus_id")
    private Bus bus;

    @ManyToOne
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @Column(name = "conductor_id")
    private Integer conductorId;

    @Column(name = "weekday_number")
    private Integer weekdayNumber;

    @Column(name = "departure_time")
    private LocalTime departureTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "status")
    private String status;

    @Column(name = "assigned_by_user_id")
    private Integer assignedByUserId;

    @Column(name = "assigned_at")
    private OffsetDateTime assignedAt;

}
