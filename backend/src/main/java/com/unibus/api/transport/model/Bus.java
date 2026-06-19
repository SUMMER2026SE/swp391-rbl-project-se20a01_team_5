package com.unibus.api.transport.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "buses")
@Getter
@Setter
@NoArgsConstructor
public class Bus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bus_id")
    private Integer id;

    @Column(name = "license_plate")
    private String licensePlate;

    @Column(name = "seat_count")
    private Integer seatCount;

    @Column(name = "bus_type")
    private String busType;

    @Column(name = "status")
    private String status;

}
