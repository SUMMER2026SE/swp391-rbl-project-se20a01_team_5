package com.unibus.api.transport;

import com.unibus.api.transport.model.BusRoute;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BusRouteRepository extends JpaRepository<BusRoute, Integer> {
   @Query(
      value = "SELECT DISTINCT r.*\nFROM routes r\nJOIN route_stops boarding ON boarding.route_id = r.route_id\nJOIN route_stops alighting ON alighting.route_id = r.route_id\nWHERE r.status = 'ACTIVE'\n  AND boarding.stop_id = :boardingStopId\n  AND alighting.stop_id = :alightingStopId\n  AND boarding.stop_order < alighting.stop_order\nORDER BY r.route_name\n",
      nativeQuery = true
   )
   List<BusRoute> searchRoutes(@Param("boardingStopId") Integer boardingStopId, @Param("alightingStopId") Integer alightingStopId);
}
