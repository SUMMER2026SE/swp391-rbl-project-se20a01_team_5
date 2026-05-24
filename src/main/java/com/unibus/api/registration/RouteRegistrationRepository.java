package com.unibus.api.registration;

import com.unibus.api.registration.model.RegistrationStatus;
import com.unibus.api.registration.model.RouteRegistration;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RouteRegistrationRepository extends JpaRepository<RouteRegistration, Integer> {
   @EntityGraph(
      attributePaths = {"route", "boardingStop", "alightingStop"}
   )
   Optional<RouteRegistration> findFirstByStudentStudentCodeAndStatusInOrderByRegisteredAtDesc(String studentCode, List<RegistrationStatus> statuses);

   @EntityGraph(
      attributePaths = {"route", "boardingStop", "alightingStop"}
   )
   Optional<RouteRegistration> findByIdAndStudentStudentCode(Integer registrationId, String studentCode);
}
