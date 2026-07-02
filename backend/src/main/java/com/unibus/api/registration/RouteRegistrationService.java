package com.unibus.api.registration;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.registration.dto.RegistrationDtos.Registration;
import com.unibus.api.registration.dto.RegistrationDtos.RegistrationRequest;
import com.unibus.api.registration.model.RegistrationStatus;
import com.unibus.api.registration.model.RouteRegistration;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.student.model.StudentVerificationStatus;
import com.unibus.api.transport.TransportService;
import com.unibus.api.transport.TransportService.RouteSelection;
import com.unibus.api.user.StudentRepository;
import com.unibus.api.user.UserRepository;
import com.unibus.api.user.model.Student;
import com.unibus.api.user.model.User;

@Service
public class RouteRegistrationService {

    private static final List<RegistrationStatus> ACTIVE_STATUSES =
            List.of(RegistrationStatus.PENDING, RegistrationStatus.APPROVED);

    private final RouteRegistrationRepository routeRegistrationRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final TransportService transportService;

    public RouteRegistrationService(
            RouteRegistrationRepository routeRegistrationRepository,
            StudentRepository studentRepository,
            UserRepository userRepository,
            TransportService transportService) {
        this.routeRegistrationRepository = routeRegistrationRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.transportService = transportService;
    }

    @Transactional(readOnly = true)
    public Registration getCurrent(CurrentUser currentUser) {
        Student student = findStudent(currentUser);
        return routeRegistrationRepository
                .findFirstByStudentStudentCodeAndStatusInOrderByRegisteredAtDesc(
                        student.getStudentCode(), ACTIVE_STATUSES)
                .map(this::toResponse)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No active route registration found"));
    }

    @Transactional(readOnly = true)
    public List<Registration> listActive(CurrentUser currentUser) {
        Student student = findStudent(currentUser);
        return routeRegistrationRepository
                .findByStudentStudentCodeAndStatusInOrderByRegisteredAtDesc(
                        student.getStudentCode(), ACTIVE_STATUSES)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public Registration register(CurrentUser currentUser, RegistrationRequest request) {
        requireVerifiedStudent(currentUser);
        Student student = findStudent(currentUser);
        RouteSelection selection = transportService.requireValidSelection(
                currentUser, request.routeId(), request.boardingStopId(), request.alightingStopId());
        if (routeRegistrationRepository.existsByStudentStudentCodeAndRouteIdAndBoardingStopIdAndAlightingStopIdAndStatusIn(
                student.getStudentCode(),
                selection.route().getId(),
                selection.boardingStop().getId(),
                selection.alightingStop().getId(),
                ACTIVE_STATUSES)) {
            throw new ApiException(HttpStatus.CONFLICT, "Student already registered this route and stop pair");
        }
        return toResponse(saveRegistration(student, selection, request.effectiveDate(), null));
    }

    @Transactional
    public Registration change(CurrentUser currentUser, Integer registrationId, RegistrationRequest request) {
        requireVerifiedStudent(currentUser);
        Student student = findStudent(currentUser);
        RouteRegistration existing = ownedRegistration(student, registrationId);
        requireActive(existing);
        RouteSelection selection = transportService.requireValidSelection(
                currentUser, request.routeId(), request.boardingStopId(), request.alightingStopId());

        if (existing.getRoute().getId().equals(selection.route().getId())) {
            existing.setBoardingStop(selection.boardingStop());
            existing.setAlightingStop(selection.alightingStop());
            existing.setEffectiveDate(request.effectiveDate() == null ? existing.getEffectiveDate() : request.effectiveDate());
            return toResponse(routeRegistrationRepository.save(existing));
        }

        if (routeRegistrationRepository.countActiveMonthlyPassesByRoute(
                student.getStudentCode(), existing.getRoute().getId()) > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Active monthly pass locks the current route until the pass expires");
        }

        existing.setStatus(RegistrationStatus.CANCELLED);
        existing.setCancellationReason("Changed to a new route registration");
        routeRegistrationRepository.save(existing);
        return toResponse(saveRegistration(student, selection, request.effectiveDate(), existing));
    }

    @Transactional
    public void cancel(CurrentUser currentUser, Integer registrationId, String reason) {
        Student student = findStudent(currentUser);
        RouteRegistration registration = ownedRegistration(student, registrationId);
        requireActive(registration);
        if (routeRegistrationRepository.countActiveMonthlyPassesByRoute(
                student.getStudentCode(), registration.getRoute().getId()) > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Không thể hủy khi vé tháng còn hiệu lực cho tuyến này");
        }
        registration.setStatus(RegistrationStatus.CANCELLED);
        registration.setCancellationReason(reason == null || reason.isBlank() ? "Cancelled by student" : reason.trim());
        routeRegistrationRepository.save(registration);
    }

    private RouteRegistration saveRegistration(
            Student student,
            RouteSelection selection,
            LocalDate effectiveDate,
            RouteRegistration previous) {
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
        return routeRegistrationRepository.save(registration);
    }

    private Student findStudent(CurrentUser currentUser) {
        return studentRepository.findByUserId(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile not found"));
    }

    private void requireVerifiedStudent(CurrentUser currentUser) {
        User user = userRepository.findById(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.getStudentVerificationStatus() != StudentVerificationStatus.VERIFIED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Student verification is required before route registration");
        }
    }

    private RouteRegistration ownedRegistration(Student student, Integer registrationId) {
        return routeRegistrationRepository.findByIdAndStudentStudentCode(registrationId, student.getStudentCode())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Route registration not found"));
    }

    private void requireActive(RouteRegistration registration) {
        if (!ACTIVE_STATUSES.contains(registration.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Route registration is no longer active");
        }
    }

    private Registration toResponse(RouteRegistration registration) {
        LocalDate monthlyPassExpiresOn = routeRegistrationRepository.activeMonthlyPassExpiresOnByRoute(
                registration.getStudent().getStudentCode(), registration.getRoute().getId());
        return new Registration(
                registration.getId(),
                registration.getRoute().getId(),
                registration.getRoute().getRouteCode(),
                registration.getRoute().getRouteName(),
                registration.getBoardingStop().getId(),
                registration.getBoardingStop().getStopName(),
                registration.getAlightingStop().getId(),
                registration.getAlightingStop().getStopName(),
                registration.getEffectiveDate(),
                registration.getStatus(),
                registration.getRegisteredAt(),
                monthlyPassExpiresOn != null,
                monthlyPassExpiresOn);
    }
}
