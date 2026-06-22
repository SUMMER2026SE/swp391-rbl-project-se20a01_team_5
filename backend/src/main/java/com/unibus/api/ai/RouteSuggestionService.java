package com.unibus.api.ai;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Rule-based route suggestion service for REQ-STU-016.
 *
 * <p>This is intentionally a lightweight rule-based implementation that ranks the
 * student's available routes by:
 * <ol>
 *   <li>Frequency (more frequent = better) - higher priority for routes with more daily trips</li>
 *   <li>Estimated duration - shorter routes rank higher</li>
 *   <li>Distance - shorter routes rank higher</li>
 *   <li>Has subsidy policy attached - routes with subsidy rank higher</li>
 * </ol>
 *
 * <p>The user-supplied preference string is parsed for keywords like "nhanh" (fast),
 * "rẻ" (cheap), "gần" (near) to bias the ranking.
 *
 * <p>For production-grade AI suggestions, replace this with a call to an LLM or
 * a recommendation model trained on historical trip data.
 */
@Service
public class RouteSuggestionService {

    private final JdbcTemplate jdbcTemplate;

    public RouteSuggestionService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<RouteSuggestionCard> suggest(Integer userId, Integer boardingStopId,
            Integer alightingStopId, String preference) {
        // Pull the student's linked routes (filtered by university linkage).
        List<RouteSuggestionCard> candidates = fetchCandidateRoutes(userId, boardingStopId, alightingStopId);
        if (candidates.isEmpty()) {
            return List.of();
        }

        ScoreContext ctx = parsePreference(preference);
        candidates.sort(Comparator
                .comparingDouble((RouteSuggestionCard r) -> score(r, ctx))
                .reversed()
                .thenComparing(r -> r.routeName));

        return candidates.size() > 5 ? candidates.subList(0, 5) : candidates;
    }

    private double score(RouteSuggestionCard r, ScoreContext ctx) {
        double score = 0;
        // Base score for being a candidate
        score += 10;
        // Subsidy bonus
        if (r.hasSubsidy) score += 20;
        // Frequency bonus (more frequent = better, capped at 30 min headway)
        if (r.frequencyMin != null && r.frequencyMin > 0) {
            score += Math.max(0, 30 - r.frequencyMin) * 0.5;
        }
        // Duration bonus
        if (r.estimatedMinutes != null) {
            score += Math.max(0, 60 - r.estimatedMinutes) * 0.3;
        }
        // Distance bonus (closer = better)
        if (r.distanceKm != null) {
            score += Math.max(0, 20 - r.distanceKm.doubleValue()) * 0.4;
        }
        // Fare bonus - cheaper is better unless user wants premium
        if (r.finalFare != null) {
            if (ctx.preferCheap) {
                score += Math.max(0, 200000 - r.finalFare.longValue()) * 0.0001;
            }
        }
        // Preference biases
        if (ctx.preferFast && r.estimatedMinutes != null) {
            score += Math.max(0, 60 - r.estimatedMinutes) * 0.4;
        }
        if (ctx.preferNear && r.distanceKm != null) {
            score += Math.max(0, 20 - r.distanceKm.doubleValue()) * 0.5;
        }
        // Reason text
        List<String> reasons = new ArrayList<>();
        if (r.hasSubsidy) reasons.add("Có trợ giá");
        if (r.frequencyMin != null && r.frequencyMin <= 15) reasons.add("Tần suất chuyến cao");
        if (r.estimatedMinutes != null && r.estimatedMinutes <= 30) reasons.add("Thời gian đi ngắn");
        if (r.distanceKm != null && r.distanceKm.doubleValue() <= 10) reasons.add("Quãng đường gần");
        r.reasons = String.join("; ", reasons);
        return score;
    }

    private ScoreContext parsePreference(String preference) {
        ScoreContext ctx = new ScoreContext();
        if (preference == null) return ctx;
        String p = preference.toLowerCase();
        ctx.preferFast = p.contains("nhanh") || p.contains("fast") || p.contains("quick");
        ctx.preferCheap = p.contains("rẻ") || p.contains("cheap") || p.contains("tiết kiệm");
        ctx.preferNear = p.contains("gần") || p.contains("near") || p.contains("short");
        return ctx;
    }

    private List<RouteSuggestionCard> fetchCandidateRoutes(Integer userId, Integer boardingStopId,
            Integer alightingStopId) {
        // Use the student's university-linked routes only.
        String sql = """
                SELECT DISTINCT r.route_id, r.route_name, r.route_code, r.color_hex,
                       r.distance_km, r.estimated_minutes, r.frequency_min,
                       COALESCE(f.amount, 0) AS final_fare,
                       (sp.subsidy_policy_id IS NOT NULL) AS has_subsidy
                FROM routes r
                JOIN route_universities ru ON ru.route_id = r.route_id AND ru.status = 'ACTIVE'
                JOIN students s ON s.university_id = ru.university_id
                LEFT JOIN LATERAL (
                    SELECT amount
                    FROM fares
                    WHERE route_id = r.route_id AND fare_type = 'MONTHLY'
                      AND effective_from <= CURRENT_DATE
                      AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
                    ORDER BY effective_from DESC LIMIT 1
                ) f ON TRUE
                LEFT JOIN LATERAL (
                    SELECT subsidy_policy_id
                    FROM subsidy_policies
                    WHERE university_id = s.university_id
                      AND status = 'ACTIVE'
                      AND active_from <= CURRENT_DATE
                      AND (active_until IS NULL OR active_until >= CURRENT_DATE)
                    ORDER BY active_from DESC LIMIT 1
                ) sp ON TRUE
                WHERE s.user_id = ?
                  AND r.status = 'ACTIVE'
                ORDER BY r.route_name
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new RouteSuggestionCard(
                rs.getInt("route_id"),
                rs.getString("route_name"),
                rs.getString("route_code"),
                rs.getString("color_hex"),
                (BigDecimal) rs.getObject("distance_km"),
                (Integer) rs.getObject("estimated_minutes"),
                (Integer) rs.getObject("frequency_min"),
                (BigDecimal) rs.getObject("final_fare"),
                rs.getBoolean("has_subsidy"),
                boardingStopId != null && alightingStopId != null), userId);
    }

    private static class ScoreContext {
        boolean preferFast;
        boolean preferCheap;
        boolean preferNear;
    }

    public static class RouteSuggestionCard {
        public final Integer routeId;
        public final String routeName;
        public final String routeCode;
        public final String colorHex;
        public final BigDecimal distanceKm;
        public final Integer estimatedMinutes;
        public final Integer frequencyMin;
        public final BigDecimal finalFare;
        public final boolean hasSubsidy;
        public final boolean directMatch;
        public String reasons;

        public RouteSuggestionCard(Integer routeId, String routeName, String routeCode, String colorHex,
                BigDecimal distanceKm, Integer estimatedMinutes, Integer frequencyMin,
                BigDecimal finalFare, boolean hasSubsidy, boolean directMatch) {
            this.routeId = routeId;
            this.routeName = routeName;
            this.routeCode = routeCode;
            this.colorHex = colorHex;
            this.distanceKm = distanceKm;
            this.estimatedMinutes = estimatedMinutes;
            this.frequencyMin = frequencyMin;
            this.finalFare = finalFare;
            this.hasSubsidy = hasSubsidy;
            this.directMatch = directMatch;
            this.reasons = "";
        }
    }
}
