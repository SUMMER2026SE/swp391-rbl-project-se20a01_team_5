package com.unibus.api.driver;

import com.unibus.api.common.ApiException;
import com.unibus.api.driver.dto.DriverDtos.DriverActionResponse;
import com.unibus.api.driver.dto.DriverDtos.DriverContact;
import com.unibus.api.driver.dto.DriverDtos.DriverContactPage;
import com.unibus.api.driver.dto.DriverDtos.DriverDashboard;
import com.unibus.api.driver.dto.DriverDtos.DriverProfile;
import com.unibus.api.driver.dto.DriverDtos.DriverSchedule;
import com.unibus.api.driver.dto.DriverDtos.DriverStop;
import com.unibus.api.driver.dto.DriverDtos.DriverTrip;
import com.unibus.api.driver.model.Conductor;
import com.unibus.api.driver.model.Driver;
import com.unibus.api.driver.model.BusSchedule;
import com.unibus.api.driver.model.Trip;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.transport.RouteStopRepository;
import com.unibus.api.transport.model.RouteStop;
import com.unibus.api.user.UserRepository;
import com.unibus.api.user.model.User;
import com.unibus.api.user.model.UserRole;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DriverService {
    private static final String ACTIVE = "ACTIVE";
    private static final String NOT_STARTED = "NOT_STARTED";
    private static final String RUNNING = "RUNNING";
    private static final String COMPLETED = "COMPLETED";

    private final DriverRepository driverRepository;
    private final BusScheduleRepository busScheduleRepository;
    private final TripRepository tripRepository;
    private final BusRepository busRepository;
    private final RouteStopRepository routeStopRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    public DriverService(
            DriverRepository driverRepository,
            BusScheduleRepository busScheduleRepository,
            TripRepository tripRepository,
            BusRepository busRepository,
            RouteStopRepository routeStopRepository,
            UserRepository userRepository,
            JdbcTemplate jdbcTemplate) {
        this.driverRepository = driverRepository;
        this.busScheduleRepository = busScheduleRepository;
        this.tripRepository = tripRepository;
        this.busRepository = busRepository;
        this.routeStopRepository = routeStopRepository;
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public DriverDashboard dashboard(CurrentUser currentUser) {
        Driver driver = requireDriver(currentUser);
        LocalDate today = LocalDate.now();
        List<BusSchedule> todaySchedules = busScheduleRepository
                .findByDriverIdAndWeekdayNumberAndStatusOrderByDepartureTimeAsc(
                        driver.getId(), weekdayNumber(today), ACTIVE);
        List<Trip> todayTrips = todaySchedules.stream()
                .map(schedule -> ensureTrip(schedule, today))
                .sorted(Comparator.comparing(trip -> trip.getSchedule().getDepartureTime()))
                .toList();
        Trip current = selectCurrentTrip(driver, today, todayTrips);
        List<DriverSchedule> schedules = busScheduleRepository
                .findByDriverIdAndStatusOrderByWeekdayNumberAscDepartureTimeAsc(driver.getId(), ACTIVE)
                .stream()
                .map(this::toSchedule)
                .toList();
        return new DriverDashboard(current == null ? null : toTrip(current), schedules,
                current == null ? "IDLE" : toUiStatus(current.getStatus()));
    }

    @Transactional
    public DriverTrip currentTrip(CurrentUser currentUser) {
        Driver driver = requireDriver(currentUser);
        LocalDate today = LocalDate.now();
        Optional<Trip> running = activeTripForDriver(driver.getId(), today);
        if (running.isPresent()) {
            return toTrip(running.get());
        }
        Optional<Trip> todayTrip = busScheduleRepository
                .findByDriverIdAndWeekdayNumberAndStatusOrderByDepartureTimeAsc(
                        driver.getId(), weekdayNumber(today), ACTIVE)
                .stream()
                .map(schedule -> ensureTrip(schedule, today))
                .sorted(Comparator.comparing(trip -> trip.getSchedule().getDepartureTime()))
                .findFirst();
        return todayTrip.or(() -> nextAssignedTrip(driver, today))
                .map(this::toTrip)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No assigned trip"));
    }

    @Transactional
    public DriverContactPage contacts(CurrentUser currentUser) {
        Driver driver = requireDriver(currentUser);
        Trip trip = activeTripForDriver(driver.getId(), LocalDate.now()).orElseGet(() -> firstTodayTrip(driver).orElse(null));
        BusSchedule schedule = trip == null ? null : trip.getSchedule();
        User dispatcherUser = schedule != null && schedule.getAssignedBy() != null
                        && UserRole.DISPATCHER.equals(schedule.getAssignedBy().getRole())
                ? schedule.getAssignedBy()
                : userRepository.findFirstByRoleOrderByIdAsc(UserRole.DISPATCHER).orElse(null);
        DriverContact dispatcher = dispatcherUser == null
                ? null
                : new DriverContact(dispatcherUser.getFullName(), "DISPATCHER", dispatcherUser.getPhoneNumber(), "ONLINE");
        DriverContact conductor = schedule == null || schedule.getConductor() == null
                ? null
                : toContact(schedule.getConductor(), "CONDUCTOR");
        List<DriverContact> contacts = new ArrayList<>();
        if (dispatcher != null) {
            contacts.add(dispatcher);
        }
        if (conductor != null) {
            contacts.add(conductor);
        }
        return new DriverContactPage(dispatcher, contacts,
                List.of("TECHNICAL", "TRAFFIC_JAM", "MEDICAL_EMERGENCY", "OTHER"));
    }

    @Transactional(readOnly = true)
    public DriverProfile profile(CurrentUser currentUser) {
        Driver driver = requireDriver(currentUser);
        User user = driver.getUser();
        LocalDate now = LocalDate.now();
        LocalDate monthStart = now.withDayOfMonth(1);
        int drivingHours = tripRepository
                .findByScheduleDriverIdAndStatusAndServiceDateBetween(driver.getId(), COMPLETED, monthStart, now)
                .stream()
                .filter(trip -> trip.getDepartedAt() != null && trip.getEndedAt() != null)
                .mapToInt(trip -> (int) Math.round(Duration.between(
                        trip.getDepartedAt(), trip.getEndedAt()).toMinutes() / 60.0))
                .sum();
        return new DriverProfile(
                "DRV-" + driver.getId(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getEmail(),
                user.getAddress(),
                (int) tripRepository.countByScheduleDriverIdAndStatus(driver.getId(), COMPLETED),
                drivingHours,
                driver.getAverageRating() == null ? null
                        : driver.getAverageRating().setScale(0, RoundingMode.HALF_UP).intValue(),
                driver.getLicenseNumber(),
                null,
                driver.getWorkStatus());
    }

    @Transactional
    public DriverActionResponse startTrip(CurrentUser currentUser, String tripId) {
        Driver driver = requireDriver(currentUser);
        Trip trip = requireDriverTrip(driver, tripId);
        if (COMPLETED.equals(trip.getStatus()) || "CANCELLED".equals(trip.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Trip cannot start from status " + trip.getStatus());
        }
        if (!LocalDate.now().equals(trip.getServiceDate())) {
            throw new ApiException(HttpStatus.CONFLICT, "Trip is not scheduled for today");
        }
        if (!RUNNING.equals(trip.getStatus())) {
            trip.setStatus(RUNNING);
            trip.setDepartedAt(now());
            trip.getBus().setStatus(RUNNING);
            driver.setWorkStatus(RUNNING);
        }
        busRepository.save(trip.getBus());
        driverRepository.save(driver);
        Trip saved = tripRepository.save(trip);
        return action("STARTED", "Chuyen xe da bat dau", saved);
    }

    @Transactional
    public DriverActionResponse endTrip(CurrentUser currentUser, String tripId) {
        Driver driver = requireDriver(currentUser);
        Trip trip = requireDriverTrip(driver, tripId);
        if (!RUNNING.equals(trip.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Trip cannot end from status " + trip.getStatus());
        }
        trip.setStatus(COMPLETED);
        trip.setEndedAt(now());
        trip.getBus().setStatus("READY");
        driver.setWorkStatus("READY");
        busRepository.save(trip.getBus());
        driverRepository.save(driver);
        Trip saved = tripRepository.save(trip);
        return action("COMPLETED", "Chuyen xe da ket thuc", saved);
    }

    @Transactional
    public DriverActionResponse reportIncident(CurrentUser currentUser, String incidentType, String note) {
        Driver driver = requireDriver(currentUser);
        Trip trip = activeTripForDriver(driver.getId(), LocalDate.now()).orElse(null);
        String category = toSupportType(incidentType);
        jdbcTemplate.update("""
                INSERT INTO support_tickets (
                    submitted_by_user_id, support_type, title, content, status, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, 'NEW', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """,
                currentUser.userId(),
                category,
                "Bao cao su co tu tai xe",
                note == null || note.isBlank() ? "Tai xe bao su co: " + category : note);
        return action("REPORTED", "Da gui bao cao su co: " + category, trip);
    }

    @Transactional
    public DriverActionResponse sendMessage(CurrentUser currentUser, String message) {
        Driver driver = requireDriver(currentUser);
        Trip trip = activeTripForDriver(driver.getId(), LocalDate.now()).orElse(null);
        User recipient = trip != null && trip.getSchedule() != null && trip.getSchedule().getAssignedBy() != null
                        && UserRole.DISPATCHER.equals(trip.getSchedule().getAssignedBy().getRole())
                ? trip.getSchedule().getAssignedBy()
                : userRepository.findFirstByRoleOrderByIdAsc(UserRole.DISPATCHER)
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Dispatcher not found"));
        jdbcTemplate.update("""
                INSERT INTO internal_messages (
                    sender_user_id, recipient_user_id, trip_id, content, is_read, sent_at
                )
                VALUES (?, ?, ?, ?, FALSE, CURRENT_TIMESTAMP)
                """,
                currentUser.userId(),
                recipient.getId(),
                trip == null ? null : trip.getId(),
                message == null || message.isBlank() ? "(Khong co noi dung)" : message);
        return action("SENT", "Tin nhan da gui", trip);
    }

    private Driver requireDriver(CurrentUser currentUser) {
        if (currentUser == null || currentUser.role() != UserRole.DRIVER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Driver account required");
        }
        return driverRepository.findByUserId(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Driver profile not found"));
    }

    private Trip ensureTrip(BusSchedule schedule, LocalDate date) {
        return tripRepository.findByScheduleIdAndServiceDate(schedule.getId(), date)
                .orElseGet(() -> {
                    Trip trip = new Trip();
                    trip.setSchedule(schedule);
                    trip.setRoute(schedule.getRoute());
                    trip.setBus(schedule.getBus());
                    trip.setDriver(schedule.getDriver());
                    trip.setConductor(schedule.getConductor());
                    trip.setServiceDate(date);
                    trip.setStatus(NOT_STARTED);
                    return tripRepository.save(trip);
                });
    }

    private Optional<Trip> firstTodayTrip(Driver driver) {
        LocalDate today = LocalDate.now();
        return busScheduleRepository
                .findByDriverIdAndWeekdayNumberAndStatusOrderByDepartureTimeAsc(
                        driver.getId(), weekdayNumber(today), ACTIVE)
                .stream()
                .map(schedule -> ensureTrip(schedule, today))
                .findFirst();
    }

    private Optional<Trip> activeTripForDriver(Integer driverId, LocalDate date) {
        return tripRepository.findFirstByDriverIdAndServiceDateAndStatusOrderByDepartedAtDesc(driverId, date, RUNNING);
    }

    private Trip selectCurrentTrip(Driver driver, LocalDate date, List<Trip> todayTrips) {
        Optional<Trip> running = activeTripForDriver(driver.getId(), date);
        if (running.isPresent()) {
            return running.get();
        }
        Trip todayTrip = todayTrips.stream()
                .filter(trip -> NOT_STARTED.equals(trip.getStatus()))
                .findFirst()
                .orElse(todayTrips.stream().findFirst().orElse(null));
        if (todayTrip != null) {
            return todayTrip;
        }
        return nextAssignedTrip(driver, date).orElse(null);
    }

    private Optional<Trip> nextAssignedTrip(Driver driver, LocalDate fromDate) {
        return busScheduleRepository.findByDriverIdAndStatusOrderByWeekdayNumberAscDepartureTimeAsc(driver.getId(), ACTIVE)
                .stream()
                .min(Comparator
                        .comparing((BusSchedule schedule) -> nextServiceDate(fromDate, schedule.getWeekdayNumber()))
                        .thenComparing(BusSchedule::getDepartureTime))
                .map(schedule -> ensureTrip(schedule, nextServiceDate(fromDate, schedule.getWeekdayNumber())));
    }

    private LocalDate nextServiceDate(LocalDate fromDate, Integer weekdayNumber) {
        int target = weekdayNumber == null ? fromDate.getDayOfWeek().getValue() : weekdayNumber;
        int delta = Math.floorMod(target - fromDate.getDayOfWeek().getValue(), 7);
        return fromDate.plusDays(delta);
    }

    private Trip requireDriverTrip(Driver driver, String tripId) {
        Integer id;
        try {
            id = Integer.valueOf(tripId);
        } catch (NumberFormatException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid trip id");
        }
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Trip not found"));
        if (!trip.getDriver().getId().equals(driver.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Trip is not assigned to this driver");
        }
        return trip;
    }

    private DriverTrip toTrip(Trip trip) {
        BusSchedule schedule = trip.getSchedule();
        List<RouteStop> routeStops = routeStopRepository.findAllByRouteIdOrderByStopOrder(trip.getRoute().getId());
        return new DriverTrip(
                trip.getId().toString(),
                trip.getRoute().getRouteName(),
                toUiStatus(trip.getStatus()),
                trip.getBus().getLicensePlate(),
                trip.getDriver().getUser().getFullName(),
                trip.getConductor() == null ? null : trip.getConductor().getUser().getFullName(),
                trip.getConductor() == null ? null : trip.getConductor().getUser().getPhoneNumber(),
                schedule == null || schedule.getAssignedBy() == null ? null : schedule.getAssignedBy().getFullName(),
                schedule == null || schedule.getAssignedBy() == null ? null : schedule.getAssignedBy().getPhoneNumber(),
                schedule == null ? "--:--" : formatTime(schedule.getDepartureTime()),
                schedule == null ? "--:--" : formatTime(schedule.getEndTime()),
                RUNNING.equals(trip.getStatus()) ? 32 : null,
                null,
                trip.getBus().getSeatCount(),
                null,
                "Khong co canh bao",
                toStops(schedule, routeStops, trip.getStatus()));
    }

    private List<DriverStop> toStops(BusSchedule schedule, List<RouteStop> routeStops, String tripStatus) {
        int currentOrder = RUNNING.equals(tripStatus) ? 1 : 0;
        int[] elapsed = { 0 };
        return routeStops.stream()
                .map(routeStop -> {
                    elapsed[0] += routeStop.getMinutesFromPreviousStop() == null ? 0
                            : routeStop.getMinutesFromPreviousStop();
                    String status = routeStop.getStopOrder() < currentOrder ? "passed"
                            : routeStop.getStopOrder().equals(currentOrder) ? "current" : "upcoming";
                    LocalTime departureTime = schedule == null ? null : schedule.getDepartureTime();
                    return new DriverStop(
                            routeStop.getStop().getId(),
                            routeStop.getStop().getStopName(),
                            departureTime == null ? "--:--" : formatTime(departureTime.plusMinutes(elapsed[0])),
                            status);
                })
                .toList();
    }

    private DriverSchedule toSchedule(BusSchedule schedule) {
        return new DriverSchedule(
                schedule.getId().toString(),
                weekdayLabel(schedule.getWeekdayNumber()) + " " + formatTime(schedule.getDepartureTime()) + " - "
                        + formatTime(schedule.getEndTime()),
                schedule.getRoute().getRouteName(),
                ACTIVE.equals(schedule.getStatus()) ? "UPCOMING" : schedule.getStatus());
    }

    private DriverContact toContact(Conductor conductor, String role) {
        User user = conductor.getUser();
        return new DriverContact(user.getFullName(), role, user.getPhoneNumber(), "ON_TRIP");
    }

    private DriverActionResponse action(String status, String message, Trip trip) {
        return new DriverActionResponse(status, message, trip == null ? null : toTrip(trip));
    }

    private String toSupportType(String incidentType) {
        if ("TECHNICAL".equals(incidentType)) {
            return "TECHNICAL";
        }
        return "OTHER";
    }

    private String toUiStatus(String status) {
        if (RUNNING.equals(status)) {
            return "IN_PROGRESS";
        }
        return status;
    }

    private String weekdayLabel(Integer weekdayNumber) {
        return switch (weekdayNumber == null ? 0 : weekdayNumber) {
            case 1 -> "T2";
            case 2 -> "T3";
            case 3 -> "T4";
            case 4 -> "T5";
            case 5 -> "T6";
            case 6 -> "T7";
            case 7 -> "CN";
            default -> "";
        };
    }

    private int weekdayNumber(LocalDate date) {
        return date.getDayOfWeek().getValue();
    }

    private String formatTime(LocalTime time) {
        return time == null ? "--:--" : time.format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(ZoneOffset.UTC);
    }
}
