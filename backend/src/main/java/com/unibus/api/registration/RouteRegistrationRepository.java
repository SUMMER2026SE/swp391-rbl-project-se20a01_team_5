package com.unibus.api.registration;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.unibus.api.registration.model.RegistrationStatus;
import com.unibus.api.registration.model.RouteRegistration;

public interface RouteRegistrationRepository extends JpaRepository<RouteRegistration, Integer> {

    @EntityGraph(attributePaths = { "route", "boardingStop", "alightingStop" })
    Optional<RouteRegistration> findFirstByStudentStudentCodeAndStatusInOrderByRegisteredAtDesc(
            String studentCode, List<RegistrationStatus> statuses);

    @EntityGraph(attributePaths = { "route", "boardingStop", "alightingStop" })
    List<RouteRegistration> findByStudentStudentCodeAndStatusInOrderByRegisteredAtDesc(
            String studentCode, List<RegistrationStatus> statuses);

    @EntityGraph(attributePaths = { "route", "boardingStop", "alightingStop" })
    Optional<RouteRegistration> findByIdAndStudentStudentCode(Integer registrationId, String studentCode);

    boolean existsByStudentStudentCodeAndRouteIdAndBoardingStopIdAndAlightingStopIdAndStatusIn(
            String studentCode,
            Integer routeId,
            Integer boardingStopId,
            Integer alightingStopId,
            List<RegistrationStatus> statuses);

    @Query(value = """
            SELECT COUNT(*)
            FROM monthly_passes mp
            WHERE mp.student_code = :studentCode
              AND mp.status = 'ACTIVE'
              AND mp.valid_from <= CURRENT_DATE
              AND mp.expires_on > CURRENT_DATE
              AND mp.route_id <> :routeId
            """, nativeQuery = true)
    long countActiveMonthlyPassesOnDifferentRoute(
            @Param("studentCode") String studentCode,
            @Param("routeId") Integer routeId);

    @Query(value = """
            SELECT COUNT(*)
            FROM monthly_passes mp
            WHERE mp.student_code = :studentCode
              AND mp.route_id = :routeId
              AND mp.status = 'ACTIVE'
              AND mp.valid_from <= CURRENT_DATE
              AND mp.expires_on > CURRENT_DATE
            """, nativeQuery = true)
    long countActiveMonthlyPassesByRoute(
            @Param("studentCode") String studentCode,
            @Param("routeId") Integer routeId);

    @Query(value = """
            SELECT MAX(mp.expires_on)
            FROM monthly_passes mp
            WHERE mp.student_code = :studentCode
              AND mp.route_id = :routeId
              AND mp.status = 'ACTIVE'
              AND mp.valid_from <= CURRENT_DATE
              AND mp.expires_on > CURRENT_DATE
            """, nativeQuery = true)
    java.time.LocalDate activeMonthlyPassExpiresOnByRoute(
            @Param("studentCode") String studentCode,
            @Param("routeId") Integer routeId);

}
