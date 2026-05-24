package com.unibus.api.registration;

import com.unibus.api.common.ApiException;
import com.unibus.api.registration.dto.RegistrationDtos;
import com.unibus.api.registration.model.RegistrationStatus;
import com.unibus.api.registration.model.RouteRegistration;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.transport.TransportService;
import com.unibus.api.user.StudentRepository;
import com.unibus.api.user.model.Student;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RouteRegistrationService {
   private static final List<RegistrationStatus> ACTIVE_STATUSES;
   private final RouteRegistrationRepository routeRegistrationRepository;
   private final StudentRepository studentRepository;
   private final TransportService transportService;

   public RouteRegistrationService(RouteRegistrationRepository routeRegistrationRepository, StudentRepository studentRepository, TransportService transportService) {
      this.routeRegistrationRepository = routeRegistrationRepository;
      this.studentRepository = studentRepository;
      this.transportService = transportService;
   }

   @Transactional(
      readOnly = true
   )
   public RegistrationDtos.Registration getCurrent(CurrentUser currentUser) {
      Student student = this.findStudent(currentUser);
      return (RegistrationDtos.Registration)this.routeRegistrationRepository.findFirstByStudentStudentCodeAndStatusInOrderByRegisteredAtDesc(student.getStudentCode(), ACTIVE_STATUSES).map(this::toResponse).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No active route registration found"));
   }

   @Transactional
   public RegistrationDtos.Registration register(CurrentUser currentUser, RegistrationDtos.RegistrationRequest request) {
      Student student = this.findStudent(currentUser);
      if (this.routeRegistrationRepository.findFirstByStudentStudentCodeAndStatusInOrderByRegisteredAtDesc(student.getStudentCode(), ACTIVE_STATUSES).isPresent()) {
         throw new ApiException(HttpStatus.CONFLICT, "Student already has an active route registration");
      } else {
         TransportService.RouteSelection selection = this.transportService.requireValidSelection(request.routeId(), request.boardingStopId(), request.alightingStopId());
         return this.toResponse(this.saveRegistration(student, selection, request.effectiveDate(), (RouteRegistration)null));
      }
   }

   @Transactional
   public RegistrationDtos.Registration change(CurrentUser currentUser, Integer registrationId, RegistrationDtos.RegistrationRequest request) {
      Student student = this.findStudent(currentUser);
      RouteRegistration existing = this.ownedRegistration(student, registrationId);
      this.requireActive(existing);
      TransportService.RouteSelection selection = this.transportService.requireValidSelection(request.routeId(), request.boardingStopId(), request.alightingStopId());
      existing.setStatus(RegistrationStatus.CANCELLED);
      existing.setCancellationReason("Changed to a new route registration");
      this.routeRegistrationRepository.save(existing);
      return this.toResponse(this.saveRegistration(student, selection, request.effectiveDate(), existing));
   }

   @Transactional
   public void cancel(CurrentUser currentUser, Integer registrationId, String reason) {
      Student student = this.findStudent(currentUser);
      RouteRegistration registration = this.ownedRegistration(student, registrationId);
      this.requireActive(registration);
      registration.setStatus(RegistrationStatus.CANCELLED);
      registration.setCancellationReason(reason != null && !reason.isBlank() ? reason.trim() : "Cancelled by student");
      this.routeRegistrationRepository.save(registration);
   }

   private RouteRegistration saveRegistration(Student student, TransportService.RouteSelection selection, LocalDate effectiveDate, RouteRegistration previous) {
      OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
      RouteRegistration registration = new RouteRegistration();
      registration.setStudent(student);
      registration.setRoute(selection.route());
      registration.setBoardingStop(selection.boardingStop());
      registration.setAlightingStop(selection.alightingStop());
      registration.setRegisteredAt(now);
      registration.setEffectiveDate(effectiveDate == null ? LocalDate.now(ZoneOffset.UTC) : effectiveDate);
      registration.setStatus(RegistrationStatus.APPROVED);
      registration.setApprovedAt(now);
      registration.setPreviousRegistration(previous);
      return (RouteRegistration)this.routeRegistrationRepository.save(registration);
   }

   private Student findStudent(CurrentUser currentUser) {
      return (Student)this.studentRepository.findByUserId(currentUser.userId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile not found"));
   }

   private RouteRegistration ownedRegistration(Student student, Integer registrationId) {
      return (RouteRegistration)this.routeRegistrationRepository.findByIdAndStudentStudentCode(registrationId, student.getStudentCode()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Route registration not found"));
   }

   private void requireActive(RouteRegistration registration) {
      if (!ACTIVE_STATUSES.contains(registration.getStatus())) {
         throw new ApiException(HttpStatus.CONFLICT, "Route registration is no longer active");
      }
   }

   private RegistrationDtos.Registration toResponse(RouteRegistration registration) {
      return new RegistrationDtos.Registration(registration.getId(), registration.getRoute().getId(), registration.getRoute().getRouteName(), registration.getBoardingStop().getId(), registration.getBoardingStop().getStopName(), registration.getAlightingStop().getId(), registration.getAlightingStop().getStopName(), registration.getEffectiveDate(), registration.getStatus(), registration.getRegisteredAt());
   }

   static {
      ACTIVE_STATUSES = List.of(RegistrationStatus.PENDING, RegistrationStatus.APPROVED);
   }
}
