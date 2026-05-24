package com.unibus.api.transport;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class EtaRepository {
   private final JdbcTemplate jdbcTemplate;

   public EtaRepository(JdbcTemplate jdbcTemplate) {
      this.jdbcTemplate = jdbcTemplate;
   }

   public List<EtaView> findRunningTripEtas(Integer routeId, Integer stopId) {
      return this.jdbcTemplate.query("SELECT sae.trip_id, t.bus_id, sae.stop_id, sae.estimated_arrival_at,\n       sae.actual_arrival_at, sae.updated_at\nFROM stop_arrival_estimates sae\nJOIN trips t ON t.trip_id = sae.trip_id\nWHERE t.route_id = ?\n  AND sae.stop_id = ?\n  AND t.status = 'RUNNING'\nORDER BY sae.estimated_arrival_at\n", (resultSet, rowNumber) -> new EtaView(resultSet.getInt("trip_id"), resultSet.getInt("bus_id"), resultSet.getInt("stop_id"), (OffsetDateTime)resultSet.getObject("estimated_arrival_at", OffsetDateTime.class), (OffsetDateTime)resultSet.getObject("actual_arrival_at", OffsetDateTime.class), (OffsetDateTime)resultSet.getObject("updated_at", OffsetDateTime.class)), new Object[]{routeId, stopId});
   }

   public static record EtaView(Integer tripId, Integer busId, Integer stopId, OffsetDateTime estimatedArrivalAt, OffsetDateTime actualArrivalAt, OffsetDateTime updatedAt) {
   }
}
