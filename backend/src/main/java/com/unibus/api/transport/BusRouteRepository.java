package com.unibus.api.transport;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.unibus.api.transport.model.BusRoute;

public interface BusRouteRepository extends JpaRepository<BusRoute, Integer> {

    @Query(value = """
            SELECT DISTINCT r.*
            FROM routes r
            JOIN route_stops boarding ON boarding.route_id = r.route_id
            JOIN route_stops alighting ON alighting.route_id = r.route_id
            WHERE r.status = 'ACTIVE'
              AND boarding.stop_id = :boardingStopId
              AND alighting.stop_id = :alightingStopId
              AND boarding.stop_order < alighting.stop_order
            ORDER BY r.route_name
            """, nativeQuery = true)
    List<BusRoute> searchRoutes(
            @Param("boardingStopId") Integer boardingStopId,
            @Param("alightingStopId") Integer alightingStopId);

    @Query(value = """
            SELECT EXISTS(SELECT 1 FROM bus_schedules WHERE route_id = :routeId) OR
                   EXISTS(SELECT 1 FROM trips WHERE route_id = :routeId) OR
                   EXISTS(SELECT 1 FROM route_registrations WHERE route_id = :routeId) OR
                   EXISTS(SELECT 1 FROM monthly_passes WHERE route_id = :routeId) OR
                   EXISTS(SELECT 1 FROM single_trip_tickets WHERE route_id = :routeId) OR
                   EXISTS(SELECT 1 FROM fares WHERE route_id = :routeId) OR
                   EXISTS(SELECT 1 FROM route_universities WHERE route_id = :routeId) OR
                   EXISTS(SELECT 1 FROM daily_statistics WHERE route_id = :routeId)
            """, nativeQuery = true)
    boolean hasAssociations(@Param("routeId") Integer routeId);
}

