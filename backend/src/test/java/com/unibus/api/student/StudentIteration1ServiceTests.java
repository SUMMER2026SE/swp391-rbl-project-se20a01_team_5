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
   private Stop boarding;
   private Stop alighting;

   @BeforeEach
   void setUp() {
      this.createQueryTables();
      this.jdbcTemplate.update("DELETE FROM stop_arrival_estimates");
      this.jdbcTemplate.update("DELETE FROM travel_history");
      this.jdbcTemplate.update("DELETE FROM trips");
      this.jdbcTemplate.update("DELETE FROM drivers");
      this.jdbcTemplate.update("DELETE FROM buses");
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
      Student student = new Student();
      student.setStudentCode("SE001");
      student.setUser(user);
      student.setUniversity("UniBus University");
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
   }

   @Test
   void searchesRouteAndManagesSingleActiveRegistration() {
      Assertions.assertThat(this.transportService.searchRoutes(this.boarding.getId(), this.alighting.getId())).singleElement().extracting(TransportDtos.RouteSuggestion::routeName).isEqualTo("Route A");
      RegistrationDtos.Registration registration = this.routeRegistrationService.register(this.currentUser, new RegistrationDtos.RegistrationRequest(this.route.getId(), this.boarding.getId(), this.alighting.getId(), (LocalDate)null));
      Assertions.assertThat(registration.status().name()).isEqualTo("APPROVED");
      ((AbstractThrowableAssert)Assertions.assertThatThrownBy(() -> this.routeRegistrationService.register(this.currentUser, new RegistrationDtos.RegistrationRequest(this.route.getId(), this.boarding.getId(), this.alighting.getId(), (LocalDate)null))).isInstanceOf(ApiException.class)).extracting((exception) -> ((ApiException)exception).getStatus()).isEqualTo(HttpStatus.CONFLICT);
      this.routeRegistrationService.cancel(this.currentUser, registration.registrationId(), "No longer needed");
      Assertions.assertThat(((RouteRegistration)this.routeRegistrationRepository.findById(registration.registrationId()).orElseThrow()).getStatus().name()).isEqualTo("CANCELLED");
   }

   @Test
   void readsEtaAndTravelHistoryFromOperationalTables() {
      OffsetDateTime estimate = OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(5L);
      User driverUser = new User();
      driverUser.setEmail("driver@student-iteration.test");
      driverUser.setPasswordHash("unused");
      driverUser.setFullName("Driver A");
      driverUser.setRole(UserRole.DRIVER);
      driverUser.setStatus(UserStatus.ACTIVE);
      driverUser.setEmailVerifiedAt(OffsetDateTime.now(ZoneOffset.UTC));
      driverUser.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
      driverUser = this.userRepository.save(driverUser);
      this.jdbcTemplate.update("INSERT INTO buses(bus_id, license_plate, seat_count, status) VALUES (?, ?, ?, ?)", new Object[]{25, "43B-00025", 45, "READY"});
      this.jdbcTemplate.update("INSERT INTO drivers(driver_id, user_id, license_number, work_status) VALUES (?, ?, ?, ?)", new Object[]{31, driverUser.getId(), "GPLX-TEST-31", "READY"});
      this.jdbcTemplate.update("INSERT INTO trips(trip_id, route_id, bus_id, driver_id, service_date, status) VALUES (?, ?, ?, ?, ?, ?)", new Object[]{11, this.route.getId(), 25, 31, LocalDate.now(ZoneOffset.UTC), "RUNNING"});
      this.jdbcTemplate.update("INSERT INTO stop_arrival_estimates(estimate_id, trip_id, stop_id, estimated_arrival_at, updated_at) VALUES (?, ?, ?, ?, ?)", new Object[]{1L, 11, this.alighting.getId(), estimate, OffsetDateTime.now(ZoneOffset.UTC)});
      this.jdbcTemplate.update("INSERT INTO travel_history(travel_history_id, student_code, trip_id, boarding_stop_id, alighting_stop_id, boarded_at) VALUES (?, ?, ?, ?, ?, ?)", new Object[]{1, "SE001", 11, this.boarding.getId(), this.alighting.getId(), OffsetDateTime.now(ZoneOffset.UTC)});
      Assertions.assertThat(this.transportService.getEtas(this.route.getId(), this.alighting.getId())).singleElement().extracting(TransportDtos.Eta::busId).isEqualTo(25);
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

   private void createQueryTables() {
      this.jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS trips (\n    trip_id INTEGER PRIMARY KEY,\n    route_id INTEGER NOT NULL,\n    bus_id INTEGER NOT NULL,\n    service_date DATE NOT NULL,\n    status VARCHAR(20) NOT NULL\n)\n");
      this.jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS stop_arrival_estimates (\n    estimate_id BIGINT PRIMARY KEY,\n    trip_id INTEGER NOT NULL,\n    stop_id INTEGER NOT NULL,\n    estimated_arrival_at TIMESTAMP WITH TIME ZONE NOT NULL,\n    actual_arrival_at TIMESTAMP WITH TIME ZONE,\n    updated_at TIMESTAMP WITH TIME ZONE NOT NULL\n)\n");
      this.jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS travel_history (\n    travel_history_id INTEGER PRIMARY KEY,\n    student_code VARCHAR(20) NOT NULL,\n    trip_id INTEGER NOT NULL,\n    boarding_stop_id INTEGER,\n    alighting_stop_id INTEGER,\n    boarded_at TIMESTAMP WITH TIME ZONE,\n    alighted_at TIMESTAMP WITH TIME ZONE\n)\n");
   }
}
