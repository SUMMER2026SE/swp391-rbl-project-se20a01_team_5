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
        return jdbcTemplate.query("""
                SELECT sae.trip_id, t.bus_id, sae.stop_id, sae.estimated_arrival_at,
                       sae.actual_arrival_at, sae.updated_at
                FROM stop_arrival_estimates sae
                JOIN trips t ON t.trip_id = sae.trip_id
                WHERE t.route_id = ?
                  AND sae.stop_id = ?
                  AND t.status = 'RUNNING'
                ORDER BY sae.estimated_arrival_at
                """, (resultSet, rowNumber) -> new EtaView(
                        resultSet.getInt("trip_id"),
                        resultSet.getInt("bus_id"),
                        resultSet.getInt("stop_id"),
                        resultSet.getObject("estimated_arrival_at", OffsetDateTime.class),
                        resultSet.getObject("actual_arrival_at", OffsetDateTime.class),
                        resultSet.getObject("updated_at", OffsetDateTime.class)),
                routeId, stopId);
    }

    public record EtaView(
            Integer tripId,
            Integer busId,
            Integer stopId,
            OffsetDateTime estimatedArrivalAt,
            OffsetDateTime actualArrivalAt,
            OffsetDateTime updatedAt) {
    }
}
