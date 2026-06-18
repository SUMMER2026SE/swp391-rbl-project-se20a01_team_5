package com.unibus.api.student;

import com.unibus.api.common.ApiException;
import com.unibus.api.registration.RouteRegistrationRepository;
import com.unibus.api.registration.RouteRegistrationService;
import com.unibus.api.registration.dto.RegistrationDtos;
import com.unibus.api.registration.model.RouteRegistration;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.transport.BusRouteRepository;
import com.unibus.api.transport.RouteStopRepository;
import com.unibus.api.transport.StopRepository;
import com.unibus.api.transport.TransportService;
import com.unibus.api.transport.dto.TransportDtos;
import com.unibus.api.transport.model.BusRoute;
import com.unibus.api.transport.model.RouteStatus;
import com.unibus.api.transport.model.RouteStop;
import com.unibus.api.transport.model.Stop;
import com.unibus.api.travel.TravelHistoryService;
import com.unibus.api.travel.TravelHistoryRepository;
import com.unibus.api.student.model.StudentVerificationStatus;
import com.unibus.api.user.StudentRepository;
import com.unibus.api.user.UserRepository;
import com.unibus.api.user.model.Student;
import com.unibus.api.user.model.User;
import com.unibus.api.user.model.UserRole;
import com.unibus.api.user.model.UserStatus;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.assertj.core.api.AbstractThrowableAssert;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;

@SpringBootTest
@DirtiesContext(
   classMode = ClassMode.AFTER_CLASS
)
class StudentIteration1ServiceTests {
   @Autowired
   private TransportService transportService;
   @Autowired
   private RouteRegistrationService routeRegistrationService;
   @Autowired
   private TravelHistoryService travelHistoryService;
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
   private RouteRegistrationRepository routeRegistrationRepository;
   @Autowired
   private JdbcTemplate jdbcTemplate;
   private CurrentUser currentUser;
   private BusRoute route;
   private BusRoute unlinkedRoute;
   private Stop boarding;
   private Stop alighting;
   private Integer universityId;

   @BeforeEach
   void setUp() {
      this.createQueryTables();
      this.jdbcTemplate.update("DELETE FROM travel_history");
      this.jdbcTemplate.update("DELETE FROM trips");
      this.jdbcTemplate.update("DELETE FROM route_universities");
      this.jdbcTemplate.update("DELETE FROM universities");
      this.routeRegistrationRepository.deleteAll();
      this.routeStopRepository.deleteAll();
      this.busRouteRepository.deleteAll();
      this.stopRepository.deleteAll();
      this.studentRepository.deleteAll();
      this.userRepository.deleteAll();
      User user = new User();
      user.setEmail("student@example.com");
      user.setPasswordHash("unused");
      user.setFullName("Student A");
      user.setRole(UserRole.STUDENT);
      user.setStatus(UserStatus.ACTIVE);
      user.setEmailVerifiedAt(OffsetDateTime.now(ZoneOffset.UTC));
      user.setStudentVerificationStatus(StudentVerificationStatus.VERIFIED);
      user.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
      this.userRepository.save(user);
      this.universityId = this.insertUniversity("UniBus University");
      Student student = new Student();
      student.setStudentCode("SE001");
      student.setUser(user);
      student.setUniversity("UniBus University");
      student.setUniversityId(this.universityId);
      this.studentRepository.save(student);
      this.currentUser = new CurrentUser(user.getId(), user.getEmail(), user.getRole(), 1L);
      this.boarding = this.saveStop("Campus");
      this.alighting = this.saveStop("Dormitory");
      this.route = new BusRoute();
      this.route.setRouteName("Route A");
      this.route.setStatus(RouteStatus.ACTIVE);
      this.route.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
      this.route = (BusRoute)this.busRouteRepository.save(this.route);
      this.saveRouteStop(this.boarding, 1);
      this.saveRouteStop(this.alighting, 2);
      this.linkRoute(this.route);
      this.unlinkedRoute = new BusRoute();
      this.unlinkedRoute.setRouteName("Route B Unlinked");
      this.unlinkedRoute.setStatus(RouteStatus.ACTIVE);
      this.unlinkedRoute.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
      this.unlinkedRoute = (BusRoute)this.busRouteRepository.save(this.unlinkedRoute);
      this.saveRouteStop(this.unlinkedRoute, this.boarding, 1);
      this.saveRouteStop(this.unlinkedRoute, this.alighting, 2);
   }

   @Test
   void searchesRouteAndManagesSingleActiveRegistration() {
      Assertions.assertThat(this.transportService.searchRoutes(this.currentUser, this.boarding.getId(), this.alighting.getId())).singleElement().extracting(TransportDtos.RouteSuggestion::routeName).isEqualTo("Route A");
      RegistrationDtos.Registration registration = this.routeRegistrationService.register(this.currentUser, new RegistrationDtos.RegistrationRequest(this.route.getId(), this.boarding.getId(), this.alighting.getId(), (LocalDate)null));
      Assertions.assertThat(registration.status().name()).isEqualTo("APPROVED");
      ((AbstractThrowableAssert)Assertions.assertThatThrownBy(() -> this.routeRegistrationService.register(this.currentUser, new RegistrationDtos.RegistrationRequest(this.route.getId(), this.boarding.getId(), this.alighting.getId(), (LocalDate)null))).isInstanceOf(ApiException.class)).extracting((exception) -> ((ApiException)exception).getStatus()).isEqualTo(HttpStatus.CONFLICT);
      this.routeRegistrationService.cancel(this.currentUser, registration.registrationId(), "No longer needed");
      Assertions.assertThat(((RouteRegistration)this.routeRegistrationRepository.findById(registration.registrationId()).orElseThrow()).getStatus().name()).isEqualTo("CANCELLED");
   }

   @Test
   void strictUniversityLinkHidesAndBlocksUnlinkedRoute() {
      Assertions.assertThat(this.transportService.searchRoutes(this.currentUser, this.boarding.getId(), this.alighting.getId()))
            .extracting(TransportDtos.RouteSuggestion::routeName)
            .containsExactly("Route A");

      ((AbstractThrowableAssert)Assertions.assertThatThrownBy(() -> this.routeRegistrationService.register(this.currentUser, new RegistrationDtos.RegistrationRequest(this.unlinkedRoute.getId(), this.boarding.getId(), this.alighting.getId(), (LocalDate)null))).isInstanceOf(ApiException.class))
            .extracting((exception) -> ((ApiException)exception).getStatus())
            .isEqualTo(HttpStatus.FORBIDDEN);
   }

   @Test
   void readsTravelHistoryFromOperationalTablesAndReturnsNoEtaRows() {
      this.jdbcTemplate.update("INSERT INTO trips(trip_id, route_id, bus_id, service_date, status) VALUES (?, ?, ?, ?, ?)", new Object[]{11, this.route.getId(), 25, LocalDate.now(ZoneOffset.UTC), "RUNNING"});
      this.jdbcTemplate.update("INSERT INTO travel_history(travel_history_id, student_code, trip_id, boarding_stop_id, alighting_stop_id, boarded_at) VALUES (?, ?, ?, ?, ?, ?)", new Object[]{1, "SE001", 11, this.boarding.getId(), this.alighting.getId(), OffsetDateTime.now(ZoneOffset.UTC)});
      Assertions.assertThat(this.transportService.getEtas(this.currentUser, this.route.getId(), this.alighting.getId())).isEmpty();
      Assertions.assertThat(this.travelHistoryService.getHistory(this.currentUser, 0, 20)).singleElement().extracting(TravelHistoryRepository.TravelHistoryView::routeName).isEqualTo("Route A");
   }

   private Stop saveStop(String name) {
      Stop stop = new Stop();
      stop.setStopName(name);
      stop.setStatus(RouteStatus.ACTIVE);
      stop.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
      return (Stop)this.stopRepository.save(stop);
   }

   private void saveRouteStop(Stop stop, int order) {
      RouteStop routeStop = new RouteStop();
      routeStop.setRoute(this.route);
      routeStop.setStop(stop);
      routeStop.setStopOrder(order);
      this.routeStopRepository.save(routeStop);
   }

   private void saveRouteStop(BusRoute targetRoute, Stop stop, int order) {
      RouteStop routeStop = new RouteStop();
      routeStop.setRoute(targetRoute);
      routeStop.setStop(stop);
      routeStop.setStopOrder(order);
      this.routeStopRepository.save(routeStop);
   }

   private Integer insertUniversity(String name) {
      this.jdbcTemplate.update("INSERT INTO universities(university_id, code, name, status) VALUES (?, ?, ?, 'ACTIVE')", 201, "UNI-STUDENT-TEST", name);
      return 201;
   }

   private void linkRoute(BusRoute targetRoute) {
      this.jdbcTemplate.update("INSERT INTO route_universities(route_id, university_id, active_from, status) VALUES (?, ?, ?, 'ACTIVE')", targetRoute.getId(), this.universityId, LocalDate.now(ZoneOffset.UTC).minusDays(1));
   }

   private void createQueryTables() {
      this.jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS universities (\n    university_id INTEGER PRIMARY KEY,\n    code VARCHAR(50) NOT NULL,\n    name VARCHAR(150) NOT NULL,\n    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL\n)\n");
      this.jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS route_universities (\n    route_university_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\n    route_id INTEGER NOT NULL,\n    university_id INTEGER NOT NULL,\n    campus_id INTEGER,\n    active_from DATE NOT NULL,\n    active_until DATE,\n    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL\n)\n");
      this.jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS trips (\n    trip_id INTEGER PRIMARY KEY,\n    route_id INTEGER NOT NULL,\n    bus_id INTEGER NOT NULL,\n    service_date DATE NOT NULL,\n    status VARCHAR(20) NOT NULL\n)\n");
      this.jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS travel_history (\n    travel_history_id INTEGER PRIMARY KEY,\n    student_code VARCHAR(20) NOT NULL,\n    trip_id INTEGER NOT NULL,\n    boarding_stop_id INTEGER,\n    alighting_stop_id INTEGER,\n    boarded_at TIMESTAMP WITH TIME ZONE,\n    alighted_at TIMESTAMP WITH TIME ZONE\n)\n");
      this.jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS monthly_passes (\n    monthly_pass_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\n    student_code VARCHAR(20) NOT NULL,\n    route_id INTEGER NOT NULL,\n    effective_month INTEGER NOT NULL,\n    effective_year INTEGER NOT NULL,\n    valid_from DATE NOT NULL,\n    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,\n    expires_on DATE NOT NULL,\n    fare_amount NUMERIC(12,0) NOT NULL,\n    qr_code VARCHAR(255),\n    last_scanned_at TIMESTAMP WITH TIME ZONE,\n    scans_today INTEGER DEFAULT 0 NOT NULL,\n    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL\n)\n");
   }
}
