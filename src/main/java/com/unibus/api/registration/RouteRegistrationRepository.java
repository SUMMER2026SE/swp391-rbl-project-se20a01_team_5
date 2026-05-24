package com.unibus.api.registration;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.unibus.api.registration.model.RegistrationStatus;
import com.unibus.api.registration.model.RouteRegistration;

public interface RouteRegistrationRepository extends JpaRepository<RouteRegistration, Integer> {

    @EntityGraph(attributePaths = { "route", "boardingStop", "alightingStop" })
    Optional<RouteRegistration> findFirstByStudentStudentCodeAndStatusInOrderByRegisteredAtDesc(
            String studentCode, List<RegistrationStatus> statuses);

    @EntityGraph(attributePaths = { "route", "boardingStop", "alightingStop" })
    Optional<RouteRegistration> findByIdAndStudentStudentCode(Integer registrationId, String studentCode);
}
