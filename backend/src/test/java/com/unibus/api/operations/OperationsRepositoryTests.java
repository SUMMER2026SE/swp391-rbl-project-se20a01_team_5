package com.unibus.api.operations;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;

import com.unibus.api.operations.OperationsDtos.ConductorTripView;

@SpringBootTest
@DirtiesContext(classMode = ClassMode.AFTER_CLASS)
class OperationsRepositoryTests {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private OperationsRepository operationsRepository;

    @BeforeEach
    void setUp() {
        createTables();
        jdbcTemplate.update("DELETE FROM route_stops");
        jdbcTemplate.update("DELETE FROM stops");
        jdbcTemplate.update("DELETE FROM trips");
        jdbcTemplate.update("DELETE FROM bus_schedules");
        jdbcTemplate.update("DELETE FROM buses");
        jdbcTemplate.update("DELETE FROM drivers");
        jdbcTemplate.update("DELETE FROM conductors");
        jdbcTemplate.update("DELETE FROM users");
        jdbcTemplate.update("DELETE FROM routes");
    }

    @Test
    void findConductorTripsIncludesTripsAssignedDirectlyOnTrip() {
        LocalDate serviceDate = LocalDate.now(ZoneOffset.UTC);
        int wrongWeekday = serviceDate.getDayOfWeek().plus(1).getValue();

        jdbcTemplate.update("""
                INSERT INTO users(user_id, email, password_hash, full_name, role, status, student_verification_status, created_at)
                VALUES
                    (1, 'driver@example.com', 'unused', 'Driver One', 'DRIVER', 'ACTIVE', 'NOT_SUBMITTED', CURRENT_TIMESTAMP),
                    (2, 'conductor@example.com', 'unused', 'Conductor One', 'CONDUCTOR', 'ACTIVE', 'NOT_SUBMITTED', CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("INSERT INTO drivers(driver_id, user_id) VALUES (10, 1)");
        jdbcTemplate.update("INSERT INTO conductors(conductor_id, user_id, employee_code) VALUES (20, 2, 'COND-20')");
        jdbcTemplate.update("""
                INSERT INTO routes(route_id, route_name, is_circular, status, created_at)
                VALUES (100, 'Campus Loop', FALSE, 'ACTIVE', CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("INSERT INTO buses(bus_id, license_plate) VALUES (200, '43B-TEST')");
        jdbcTemplate.update("""
                INSERT INTO bus_schedules(schedule_id, route_id, bus_id, driver_id, conductor_id, weekday_number, departure_time)
                VALUES (300, 100, 200, 10, NULL, ?, ?)
                """, wrongWeekday, LocalTime.of(7, 30));
        jdbcTemplate.update("""
                INSERT INTO trips(trip_id, schedule_id, route_id, bus_id, driver_id, conductor_id, service_date, status)
                VALUES (400, 300, 100, 200, 10, 20, ?, 'RUNNING')
                """, serviceDate);

        List<ConductorTripView> trips = operationsRepository.findConductorTrips(20, serviceDate);

        assertThat(trips).hasSize(1);
        assertThat(trips.get(0).tripId()).isEqualTo(400);
        assertThat(trips.get(0).routeName()).isEqualTo("Campus Loop");
        assertThat(trips.get(0).status()).isEqualTo("RUNNING");
    }

    @Test
    void ensureTripIsIdempotentForScheduleAndServiceDate() {
        LocalDate serviceDate = LocalDate.now(ZoneOffset.UTC);
        jdbcTemplate.update("""
                INSERT INTO users(user_id, email, password_hash, full_name, role, status, student_verification_status, created_at)
                VALUES
                    (1, 'driver@example.com', 'unused', 'Driver One', 'DRIVER', 'ACTIVE', 'NOT_SUBMITTED', CURRENT_TIMESTAMP),
                    (2, 'conductor@example.com', 'unused', 'Conductor One', 'CONDUCTOR', 'ACTIVE', 'NOT_SUBMITTED', CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("INSERT INTO drivers(driver_id, user_id) VALUES (10, 1)");
        jdbcTemplate.update("INSERT INTO conductors(conductor_id, user_id, employee_code) VALUES (20, 2, 'COND-20')");
        jdbcTemplate.update("""
                INSERT INTO routes(route_id, route_name, is_circular, status, created_at)
                VALUES (100, 'Campus Loop', FALSE, 'ACTIVE', CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("INSERT INTO buses(bus_id, license_plate) VALUES (200, '43B-TEST')");
        jdbcTemplate.update("""
                INSERT INTO bus_schedules(schedule_id, route_id, bus_id, driver_id, conductor_id, weekday_number, departure_time)
                VALUES (300, 100, 200, 10, 20, ?, ?)
                """, serviceDate.getDayOfWeek().getValue(), LocalTime.of(7, 30));

        operationsRepository.ensureTrip(300, serviceDate);
        operationsRepository.ensureTrip(300, serviceDate);

        Integer count = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM trips WHERE schedule_id = 300 AND service_date = ?",
                Integer.class,
                serviceDate);
        assertThat(count).isEqualTo(1);
    }
    private void createTables() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id INTEGER PRIMARY KEY,
                    email VARCHAR(255),
                    full_name VARCHAR(255),
                    role VARCHAR(50),
                    status VARCHAR(50)
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS drivers (
                    driver_id INTEGER PRIMARY KEY,
                    user_id INTEGER NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS conductors (
                    conductor_id INTEGER PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    employee_code VARCHAR(50)
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS routes (
                    route_id INTEGER PRIMARY KEY,
                    route_name VARCHAR(255) NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS buses (
                    bus_id INTEGER PRIMARY KEY,
                    license_plate VARCHAR(50)
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS bus_schedules (
                    schedule_id INTEGER PRIMARY KEY,
                    route_id INTEGER NOT NULL,
                    bus_id INTEGER,
                    driver_id INTEGER,
                    conductor_id INTEGER,
                    weekday_number INTEGER NOT NULL,
                    departure_time TIME NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS trips (
                    trip_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    schedule_id INTEGER,
                    route_id INTEGER NOT NULL,
                    bus_id INTEGER NOT NULL,
                    driver_id INTEGER NOT NULL,
                    conductor_id INTEGER,
                    service_date DATE NOT NULL,
                    departed_at TIMESTAMP WITH TIME ZONE,
                    ended_at TIMESTAMP WITH TIME ZONE,
                    status VARCHAR(20) DEFAULT 'NOT_STARTED' NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS stops (
                    stop_id INTEGER PRIMARY KEY,
                    stop_name VARCHAR(255) NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS route_stops (
                    route_stop_id INTEGER PRIMARY KEY,
                    route_id INTEGER NOT NULL,
                    stop_id INTEGER NOT NULL,
                    stop_order INTEGER NOT NULL,
                    minutes_from_previous_stop INTEGER
                )
                """);
    }
}
