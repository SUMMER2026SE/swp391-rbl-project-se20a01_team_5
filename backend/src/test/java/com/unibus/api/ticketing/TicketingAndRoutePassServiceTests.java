package com.unibus.api.ticketing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;

import com.unibus.api.common.ApiException;
import com.unibus.api.registration.RouteRegistrationRepository;
import com.unibus.api.registration.RouteRegistrationService;
import com.unibus.api.registration.dto.RegistrationDtos.Registration;
import com.unibus.api.registration.dto.RegistrationDtos.RegistrationRequest;
import com.unibus.api.registration.model.RouteRegistration;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.student.model.StudentVerificationStatus;
import com.unibus.api.ticketing.TicketingDtos.PurchaseMonthlyPassRequest;
import com.unibus.api.ticketing.TicketingDtos.TicketView;
import com.unibus.api.transport.BusRouteRepository;
import com.unibus.api.transport.RouteStopRepository;
import com.unibus.api.transport.StopRepository;
import com.unibus.api.transport.model.BusRoute;
import com.unibus.api.transport.model.RouteStatus;
import com.unibus.api.transport.model.RouteStop;
import com.unibus.api.transport.model.Stop;
import com.unibus.api.user.StudentRepository;
import com.unibus.api.user.UserRepository;
import com.unibus.api.user.model.Student;
import com.unibus.api.user.model.User;
import com.unibus.api.user.model.UserRole;
import com.unibus.api.user.model.UserStatus;

@SpringBootTest
@DirtiesContext(classMode = ClassMode.AFTER_CLASS)
class TicketingAndRoutePassServiceTests {

    @Autowired
    private TicketingService ticketingService;

    @Autowired
    private RouteRegistrationService routeRegistrationService;

    @Autowired
    private RouteRegistrationRepository routeRegistrationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private StopRepository stopRepository;

    @Autowired
    private BusRouteRepository busRouteRepository;

    @Autowired
    private RouteStopRepository routeStopRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private CurrentUser currentUser;
    private BusRoute routeA;
    private BusRoute routeB;
    private Stop campus;
    private Stop library;
    private Stop dormitory;
    private Stop station;
    private Registration registration;
    private Integer universityId;

    @BeforeEach
    void setUp() {
        createTicketTables();
        jdbcTemplate.update("DELETE FROM invoices");
        jdbcTemplate.update("DELETE FROM payments");
        jdbcTemplate.update("DELETE FROM monthly_passes");
        jdbcTemplate.update("DELETE FROM fares");
        jdbcTemplate.update("DELETE FROM subsidy_policies");
        jdbcTemplate.update("DELETE FROM route_universities");
        jdbcTemplate.update("DELETE FROM universities");
        routeRegistrationRepository.deleteAll();
        routeStopRepository.deleteAll();
        busRouteRepository.deleteAll();
        stopRepository.deleteAll();
        studentRepository.deleteAll();
        userRepository.deleteAll();

        User user = new User();
        user.setEmail("ticket.student@example.com");
        user.setPasswordHash("unused");
        user.setFullName("Ticket Student");
        user.setRole(UserRole.STUDENT);
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerifiedAt(OffsetDateTime.now(ZoneOffset.UTC));
        user.setStudentVerificationStatus(StudentVerificationStatus.VERIFIED);
        user.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        user = userRepository.save(user);

        universityId = insertUniversity("UniBus University");

        Student student = new Student();
        student.setStudentCode("SE-TICKET-001");
        student.setUser(user);
        student.setUniversity("UniBus University");
        student.setUniversityId(universityId);
        studentRepository.save(student);
        currentUser = new CurrentUser(user.getId(), user.getEmail(), user.getRole(), 1L);

        campus = saveStop("Campus Gate");
        library = saveStop("Library");
        dormitory = saveStop("Dormitory");
        station = saveStop("Central Station");
        routeA = saveRoute("Route A");
        routeB = saveRoute("Route B");
        saveRouteStop(routeA, campus, 1);
        saveRouteStop(routeA, library, 2);
        saveRouteStop(routeA, dormitory, 3);
        saveRouteStop(routeB, campus, 1);
        saveRouteStop(routeB, station, 2);
        linkRoute(routeA, universityId);
        linkRoute(routeB, universityId);
        insertMonthlyFare(routeA, "120000");
        insertMonthlyFare(routeB, "150000");

        registration = routeRegistrationService.register(currentUser,
                new RegistrationRequest(routeA.getId(), campus.getId(), library.getId(), null));
    }

    @Test
    void purchaseMonthlyPassCreatesPassPaymentInvoiceAndIsIdempotentForMonth() {
        TicketView ticket = ticketingService.purchaseMonthlyPass(currentUser,
                new PurchaseMonthlyPassRequest("BANK_TRANSFER"));

        assertThat(ticket.ticketType()).isEqualTo("MONTHLY");
        assertThat(ticket.routeId()).isEqualTo(routeA.getId());
        assertThat(ticket.fareAmount()).isEqualByComparingTo(new BigDecimal("120000"));
        assertThat(ticket.originalFareAmount()).isEqualByComparingTo(new BigDecimal("120000"));
        assertThat(ticket.subsidyAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(ticket.finalFareAmount()).isEqualByComparingTo(new BigDecimal("120000"));
        assertThat(ticket.subsidyStatus()).isEqualTo("NOT_CONFIGURED");
        assertThat(ticket.qrCode()).startsWith("UB-MONTHLY-");
        assertTableCount("monthly_passes", 1);
        assertTableCount("payments", 1);
        assertTableCount("invoices", 1);

        TicketView sameTicket = ticketingService.purchaseMonthlyPass(currentUser,
                new PurchaseMonthlyPassRequest("BANK_TRANSFER"));

        assertThat(sameTicket.ticketId()).isEqualTo(ticket.ticketId());
        assertTableCount("monthly_passes", 1);
        assertTableCount("payments", 1);
        assertTableCount("invoices", 1);
    }

    @Test
    void monthlyPassAppliesPercentageSubsidyAndPersistsBreakdown() {
        insertSubsidyPolicy("PERCENTAGE", "50", "60000");

        TicketView ticket = ticketingService.purchaseMonthlyPass(currentUser,
                new PurchaseMonthlyPassRequest("BANK_TRANSFER"));

        assertThat(ticket.originalFareAmount()).isEqualByComparingTo(new BigDecimal("120000"));
        assertThat(ticket.subsidyAmount()).isEqualByComparingTo(new BigDecimal("60000"));
        assertThat(ticket.finalFareAmount()).isEqualByComparingTo(new BigDecimal("60000"));
        assertThat(ticket.fareAmount()).isEqualByComparingTo(new BigDecimal("60000"));
        assertThat(ticket.subsidyPolicyId()).isNotNull();
        assertThat(ticket.subsidyStatus()).isEqualTo("APPLIED");

        assertThat(jdbcTemplate.queryForObject("SELECT amount FROM payments", BigDecimal.class))
                .isEqualByComparingTo(new BigDecimal("60000"));
        assertThat(jdbcTemplate.queryForObject("SELECT original_amount FROM invoices", BigDecimal.class))
                .isEqualByComparingTo(new BigDecimal("120000"));
        assertThat(jdbcTemplate.queryForObject("SELECT subsidy_amount FROM invoices", BigDecimal.class))
                .isEqualByComparingTo(new BigDecimal("60000"));
        assertThat(jdbcTemplate.queryForObject("SELECT final_amount FROM invoices", BigDecimal.class))
                .isEqualByComparingTo(new BigDecimal("60000"));
    }

    @Test
    void monthlyPassAllowsFullySubsidizedZeroPayment() {
        insertSubsidyPolicy("PERCENTAGE", "100", null);

        TicketView ticket = ticketingService.purchaseMonthlyPass(currentUser,
                new PurchaseMonthlyPassRequest("BANK_TRANSFER"));

        assertThat(ticket.originalFareAmount()).isEqualByComparingTo(new BigDecimal("120000"));
        assertThat(ticket.subsidyAmount()).isEqualByComparingTo(new BigDecimal("120000"));
        assertThat(ticket.finalFareAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(jdbcTemplate.queryForObject("SELECT amount FROM payments", BigDecimal.class))
                .isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(jdbcTemplate.queryForObject("SELECT final_amount FROM invoices", BigDecimal.class))
                .isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void activeMonthlyPassBlocksDifferentRouteButAllowsSameRouteStopUpdate() {
        ticketingService.purchaseMonthlyPass(currentUser, new PurchaseMonthlyPassRequest("BANK_TRANSFER"));

        assertThatThrownBy(() -> routeRegistrationService.change(currentUser, registration.registrationId(),
                new RegistrationRequest(routeB.getId(), campus.getId(), station.getId(), null)))
                .isInstanceOf(ApiException.class)
                .extracting(error -> ((ApiException) error).getStatus())
                .isEqualTo(HttpStatus.CONFLICT);

        Registration updated = routeRegistrationService.change(currentUser, registration.registrationId(),
                new RegistrationRequest(routeA.getId(), library.getId(), dormitory.getId(), null));

        assertThat(updated.registrationId()).isEqualTo(registration.registrationId());
        assertThat(updated.boardingStopId()).isEqualTo(library.getId());
        assertThat(updated.alightingStopId()).isEqualTo(dormitory.getId());
        assertThat(routeRegistrationRepository.findAll()).hasSize(1);
        RouteRegistration persisted = routeRegistrationRepository.findById(registration.registrationId()).orElseThrow();
        assertThat(persisted.getStatus().name()).isEqualTo("APPROVED");

        assertThatThrownBy(() -> routeRegistrationService.cancel(currentUser, registration.registrationId(), "No longer needed"))
                .isInstanceOf(ApiException.class)
                .extracting(error -> ((ApiException) error).getStatus())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    private Stop saveStop(String name) {
        Stop stop = new Stop();
        stop.setStopName(name);
        stop.setStatus(RouteStatus.ACTIVE);
        stop.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        return stopRepository.save(stop);
    }

    private BusRoute saveRoute(String name) {
        BusRoute route = new BusRoute();
        route.setRouteName(name);
        route.setStatus(RouteStatus.ACTIVE);
        route.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        return busRouteRepository.save(route);
    }

    private void saveRouteStop(BusRoute route, Stop stop, int order) {
        RouteStop routeStop = new RouteStop();
        routeStop.setRoute(route);
        routeStop.setStop(stop);
        routeStop.setStopOrder(order);
        routeStopRepository.save(routeStop);
    }

    private void insertMonthlyFare(BusRoute route, String amount) {
        jdbcTemplate.update("""
                INSERT INTO fares(route_id, fare_type, amount, effective_from, notes)
                VALUES (?, 'MONTHLY', ?, ?, 'test fare')
                """, route.getId(), new BigDecimal(amount), LocalDate.now(ZoneOffset.UTC).minusDays(1));
    }

    private Integer insertUniversity(String name) {
        jdbcTemplate.update("""
                INSERT INTO universities(university_id, code, name, status)
                VALUES (?, ?, ?, 'ACTIVE')
                """, 101, "UNI-TEST", name);
        return 101;
    }

    private void linkRoute(BusRoute route, Integer linkedUniversityId) {
        jdbcTemplate.update("""
                INSERT INTO route_universities(route_id, university_id, active_from, status)
                VALUES (?, ?, ?, 'ACTIVE')
                """, route.getId(), linkedUniversityId, LocalDate.now(ZoneOffset.UTC).minusDays(1));
    }

    private void insertSubsidyPolicy(String type, String value, String maxAmount) {
        jdbcTemplate.update("""
                INSERT INTO subsidy_policies(university_id, policy_name, subsidy_type, "value", max_amount, active_from, status)
                VALUES (?, 'Test subsidy policy', ?, ?, ?, ?, 'ACTIVE')
                """, universityId, type, new BigDecimal(value), maxAmount == null ? null : new BigDecimal(maxAmount),
                LocalDate.now(ZoneOffset.UTC).minusDays(1));
    }

    private void assertTableCount(String table, int expected) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class);
        assertThat(count).isEqualTo(expected);
    }

    private void createTicketTables() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS universities (
                    university_id INTEGER PRIMARY KEY,
                    code VARCHAR(50) NOT NULL,
                    name VARCHAR(150) NOT NULL,
                    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS route_universities (
                    route_university_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    route_id INTEGER NOT NULL,
                    university_id INTEGER NOT NULL,
                    campus_id INTEGER,
                    active_from DATE NOT NULL,
                    active_until DATE,
                    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS subsidy_policies (
                    subsidy_policy_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    university_id INTEGER NOT NULL,
                    campus_id INTEGER,
                    policy_name VARCHAR(150) NOT NULL,
                    subsidy_type VARCHAR(20) NOT NULL,
                    "value" NUMERIC(12,2) NOT NULL,
                    max_amount NUMERIC(12,0),
                    active_from DATE NOT NULL,
                    active_until DATE,
                    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS fares (
                    fare_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    route_id INTEGER NOT NULL,
                    fare_type VARCHAR(10) NOT NULL,
                    amount NUMERIC(12,0) NOT NULL,
                    effective_from DATE NOT NULL,
                    effective_until DATE,
                    notes VARCHAR(500)
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS monthly_passes (
                    monthly_pass_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    student_code VARCHAR(20) NOT NULL,
                    route_id INTEGER NOT NULL,
                    effective_month INTEGER NOT NULL,
                    effective_year INTEGER NOT NULL,
                    valid_from DATE NOT NULL,
                    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    expires_on DATE NOT NULL,
                    fare_amount NUMERIC(12,0) NOT NULL,
                    original_fare_amount NUMERIC(12,0),
                    subsidy_amount NUMERIC(12,0),
                    final_fare_amount NUMERIC(12,0),
                    subsidy_policy_id INTEGER,
                    qr_code VARCHAR(255),
                    last_scanned_at TIMESTAMP WITH TIME ZONE,
                    scans_today INTEGER DEFAULT 0 NOT NULL,
                    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS payments (
                    payment_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    student_code VARCHAR(20) NOT NULL,
                    monthly_pass_id INTEGER,
                    amount NUMERIC(12,0) NOT NULL,
                    method VARCHAR(20) NOT NULL,
                    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL,
                    transaction_code VARCHAR(100),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    notes VARCHAR(500)
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS invoices (
                    invoice_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    payment_id INTEGER NOT NULL UNIQUE,
                    student_code VARCHAR(20) NOT NULL,
                    description VARCHAR(500) NOT NULL,
                    amount NUMERIC(12,0) NOT NULL,
                    original_amount NUMERIC(12,0),
                    subsidy_amount NUMERIC(12,0),
                    final_amount NUMERIC(12,0),
                    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
                """);
    }
}
