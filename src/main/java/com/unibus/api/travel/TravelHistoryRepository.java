package com.unibus.api.travel;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class TravelHistoryRepository {
   private final JdbcTemplate jdbcTemplate;

   public TravelHistoryRepository(JdbcTemplate jdbcTemplate) {
      this.jdbcTemplate = jdbcTemplate;
   }

   public List<TravelHistoryView> findRecentByStudentCode(String studentCode, int limit, int offset) {
      return this.jdbcTemplate.query("SELECT th.travel_history_id, th.trip_id, r.route_id, r.route_name,\n       t.service_date, th.boarded_at, th.alighted_at,\n       bs.stop_name AS boarding_stop_name,\n       als.stop_name AS alighting_stop_name\nFROM travel_history th\nJOIN trips t ON t.trip_id = th.trip_id\nJOIN routes r ON r.route_id = t.route_id\nLEFT JOIN stops bs ON bs.stop_id = th.boarding_stop_id\nLEFT JOIN stops als ON als.stop_id = th.alighting_stop_id\nWHERE th.student_code = ?\nORDER BY t.service_date DESC, th.boarded_at DESC\nLIMIT ? OFFSET ?\n", (resultSet, rowNumber) -> new TravelHistoryView(resultSet.getInt("travel_history_id"), resultSet.getInt("trip_id"), resultSet.getInt("route_id"), resultSet.getString("route_name"), (LocalDate)resultSet.getObject("service_date", LocalDate.class), (OffsetDateTime)resultSet.getObject("boarded_at", OffsetDateTime.class), (OffsetDateTime)resultSet.getObject("alighted_at", OffsetDateTime.class), resultSet.getString("boarding_stop_name"), resultSet.getString("alighting_stop_name")), new Object[]{studentCode, limit, offset});
   }

   public static record TravelHistoryView(Integer travelHistoryId, Integer tripId, Integer routeId, String routeName, LocalDate serviceDate, OffsetDateTime boardedAt, OffsetDateTime alightedAt, String boardingStopName, String alightingStopName) {
   }
}
