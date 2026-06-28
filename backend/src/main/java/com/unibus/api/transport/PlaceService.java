package com.unibus.api.transport;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unibus.api.transport.dto.TransportDtos.PlaceReverseResult;
import com.unibus.api.transport.dto.TransportDtos.PlaceSuggestion;
import com.unibus.api.transport.dto.TransportDtos.RouteReference;

@Service
public class PlaceService {

    private static final int DEFAULT_LIMIT = 8;
    private static final double DANANG_CENTER_LAT = 16.061034;
    private static final double DANANG_CENTER_LNG = 108.223935;

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final Map<String, List<PlaceSuggestion>> searchCache = new ConcurrentHashMap<>();
    private final Map<String, PlaceReverseResult> reverseCache = new ConcurrentHashMap<>();

    public PlaceService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(4))
                .build();
    }

    @Transactional(readOnly = true)
    public List<PlaceSuggestion> search(String query, BigDecimal latitude, BigDecimal longitude, Integer limit) {
        int resolvedLimit = limit == null || limit <= 0 ? DEFAULT_LIMIT : Math.min(limit, 15);
        String normalized = normalize(query);
        double refLat = number(latitude, DANANG_CENTER_LAT);
        double refLng = number(longitude, DANANG_CENTER_LNG);
        List<PlaceSuggestion> local = localStopSuggestions(normalized, refLat, refLng, resolvedLimit);
        if (local.size() >= resolvedLimit || normalized.length() < 3) {
            return local;
        }
        List<PlaceSuggestion> external = externalSearch(normalized, resolvedLimit - local.size());
        List<PlaceSuggestion> merged = new ArrayList<>(local);
        merged.addAll(external);
        return merged.stream().limit(resolvedLimit).toList();
    }

    @Transactional(readOnly = true)
    public PlaceReverseResult reverse(BigDecimal latitude, BigDecimal longitude) {
        double lat = number(latitude, DANANG_CENTER_LAT);
        double lng = number(longitude, DANANG_CENTER_LNG);
        StopPlace nearest = localStops().stream()
                .filter(StopPlace::hasCoordinate)
                .min(Comparator.comparingInt(stop -> meters(lat, lng, stop.lat(), stop.lng())))
                .orElse(null);
        if (nearest != null && meters(lat, lng, nearest.lat(), nearest.lng()) <= 450) {
            int distance = meters(lat, lng, nearest.lat(), nearest.lng());
            return new PlaceReverseResult(
                    nearest.name(),
                    nearest.address(),
                    bd(lat),
                    bd(lng),
                    nearest.stopId(),
                    nearest.name(),
                    distance);
        }
        return externalReverse(lat, lng);
    }

    private List<PlaceSuggestion> localStopSuggestions(String normalized, double refLat, double refLng, int limit) {
        return localStops().stream()
                .filter(stop -> matchesSearch(stop.searchText(), normalized))
                .sorted(Comparator
                        .comparingInt((StopPlace stop) -> searchScore(stop, normalized))
                        .thenComparingInt((StopPlace stop) -> officialNamePriority(stop))
                        .thenComparingInt((StopPlace stop) -> stop.hasCoordinate()
                                ? meters(refLat, refLng, stop.lat(), stop.lng())
                                : Integer.MAX_VALUE)
                        .thenComparing(stop -> displayStopName(stop)))
                .limit(limit)
                .map(stop -> new PlaceSuggestion(
                        "stop:" + stop.stopId(),
                        "STOP",
                        displayStopName(stop),
                        stop.address(),
                        bd(stop.lat()),
                        bd(stop.lng()),
                        stop.stopId(),
                        stop.hasCoordinate() ? meters(refLat, refLng, stop.lat(), stop.lng()) : null,
                        routesForStop(stop.stopId())))
                .toList();
    }

    private List<StopPlace> localStops() {
        return jdbcTemplate.query("""
                SELECT stop_id, stop_name, address, latitude, longitude, stop_code
                FROM stops
                WHERE status = 'ACTIVE'
                  AND latitude IS NOT NULL
                  AND longitude IS NOT NULL
                  AND (
                      external_source = 'BUSMAP_DN'
                      OR NOT EXISTS (
                          SELECT 1
                          FROM stops official_stops
                          WHERE official_stops.external_source = 'BUSMAP_DN'
                            AND official_stops.status = 'ACTIVE'
                      )
                  )
                ORDER BY stop_name
                """, (rs, rowNum) -> new StopPlace(
                        rs.getInt("stop_id"),
                        rs.getString("stop_name"),
                        rs.getString("address"),
                        rs.getBigDecimal("latitude"),
                        rs.getBigDecimal("longitude"),
                        rs.getString("stop_code")));
    }

    private List<RouteReference> routesForStop(Integer stopId) {
        return jdbcTemplate.query("""
                SELECT DISTINCT r.route_id, r.route_name, r.route_code, r.color_hex
                FROM routes r
                JOIN route_stops rs ON rs.route_id = r.route_id
                WHERE rs.stop_id = ?
                  AND r.status = 'ACTIVE'
                  AND (
                      r.external_source = 'BUSMAP_DN'
                      OR NOT EXISTS (
                          SELECT 1
                          FROM routes official_routes
                          WHERE official_routes.external_source = 'BUSMAP_DN'
                            AND official_routes.status = 'ACTIVE'
                      )
                  )
                ORDER BY r.route_code NULLS LAST, r.route_name
                LIMIT 8
                """, (rs, rowNum) -> new RouteReference(
                        rs.getInt("route_id"),
                        rs.getString("route_name"),
                        rs.getString("route_code"),
                        rs.getString("color_hex")), stopId);
    }

    private List<PlaceSuggestion> externalSearch(String normalized, int limit) {
        String cacheKey = normalized + ":" + limit;
        return searchCache.computeIfAbsent(cacheKey, ignored -> {
            try {
                String encoded = URLEncoder.encode(normalized + " Đà Nẵng", StandardCharsets.UTF_8);
                URI uri = URI.create("https://nominatim.openstreetmap.org/search?format=jsonv2&limit="
                        + limit + "&countrycodes=vn&q=" + encoded);
                HttpRequest request = HttpRequest.newBuilder(uri)
                        .timeout(Duration.ofSeconds(5))
                        .header("User-Agent", "UniBus/1.0 student journey planner")
                        .GET()
                        .build();
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() < 200 || response.statusCode() >= 300) {
                    return List.of();
                }
                JsonNode root = objectMapper.readTree(response.body());
                List<PlaceSuggestion> suggestions = new ArrayList<>();
                for (JsonNode node : root) {
                    double lat = node.path("lat").asDouble(Double.NaN);
                    double lng = node.path("lon").asDouble(Double.NaN);
                    if (Double.isNaN(lat) || Double.isNaN(lng)) {
                        continue;
                    }
                    String label = node.path("name").asText("");
                    String display = node.path("display_name").asText(label);
                    suggestions.add(new PlaceSuggestion(
                            "osm:" + node.path("place_id").asText(),
                            "ADDRESS",
                            label.isBlank() ? firstAddressPart(display) : label,
                            display,
                            bd(lat),
                            bd(lng),
                            null,
                            meters(DANANG_CENTER_LAT, DANANG_CENTER_LNG, lat, lng),
                            List.of()));
                }
                return suggestions;
            } catch (Exception ignoredException) {
                return List.of();
            }
        });
    }

    private PlaceReverseResult externalReverse(double lat, double lng) {
        String cacheKey = String.format(Locale.ROOT, "%.5f,%.5f", lat, lng);
        return reverseCache.computeIfAbsent(cacheKey, ignored -> {
            try {
                URI uri = URI.create("https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat="
                        + lat + "&lon=" + lng + "&zoom=18&addressdetails=1");
                HttpRequest request = HttpRequest.newBuilder(uri)
                        .timeout(Duration.ofSeconds(5))
                        .header("User-Agent", "UniBus/1.0 student journey planner")
                        .GET()
                        .build();
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    JsonNode node = objectMapper.readTree(response.body());
                    String display = node.path("display_name").asText("Vị trí đã chọn");
                    return new PlaceReverseResult(firstAddressPart(display), display, bd(lat), bd(lng), null, null, null);
                }
            } catch (Exception ignoredException) {
                // Fall through to coordinate label.
            }
            return new PlaceReverseResult("Vị trí đã chọn", lat + ", " + lng, bd(lat), bd(lng), null, null, null);
        });
    }

    static int meters(double lat1, double lng1, double lat2, double lng2) {
        double radius = 6_371_000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return (int) Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }

    static BigDecimal bd(double value) {
        if (Double.isNaN(value) || Double.isInfinite(value)) {
            return null;
        }
        return BigDecimal.valueOf(value).setScale(8, java.math.RoundingMode.HALF_UP);
    }

    static double number(BigDecimal value, double fallback) {
        return value == null ? fallback : value.doubleValue();
    }

    static String normalize(String value) {
        if (value == null) {
            return "";
        }
        String folded = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'd');
        return folded.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
    }

    static boolean matchesSearch(String searchText, String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) {
            return true;
        }
        if (searchText.contains(normalizedQuery)) {
            return true;
        }
        String[] tokens = normalizedQuery.split("\\s+");
        for (String token : tokens) {
            if (token.length() > 1 && !searchText.contains(token)) {
                return false;
            }
        }
        return true;
    }

    private int searchScore(StopPlace stop, String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) {
            return 0;
        }
        String displayName = normalize(displayStopName(stop));
        String searchText = normalize(displayStopName(stop) + " " + stop.address() + " " + stop.stopCode());
        if (displayName.equals(normalizedQuery)) {
            return 0;
        }
        if (displayName.contains(normalizedQuery)) {
            return 1;
        }
        if (searchText.contains(normalizedQuery)) {
            return 2;
        }
        int matchedTokens = 0;
        String[] tokens = normalizedQuery.split("\\s+");
        for (String token : tokens) {
            if (token.length() > 1 && searchText.contains(token)) {
                matchedTokens++;
            }
        }
        return 20 + Math.max(0, tokens.length - matchedTokens);
    }

    private int officialNamePriority(StopPlace stop) {
        String name = normalize(displayStopName(stop));
        if (name.contains("ben xe buyt") || name.contains("tram xe buyt")) {
            return 0;
        }
        if (name.contains("dai hoc") || name.contains("cao dang")) {
            return 1;
        }
        return 2;
    }

    private String displayStopName(StopPlace stop) {
        String normalizedName = normalize(stop.name());
        if ("dai hoc viet".equals(normalizedName)) {
            return "Đại học Việt Hàn";
        }
        return stop.name();
    }

    private String firstAddressPart(String display) {
        if (display == null || display.isBlank()) {
            return "Địa điểm";
        }
        int comma = display.indexOf(',');
        return comma < 0 ? display : display.substring(0, comma).trim();
    }

    private record StopPlace(Integer stopId, String name, String address, BigDecimal latitude,
            BigDecimal longitude, String stopCode) {
        boolean hasCoordinate() {
            return latitude != null && longitude != null;
        }

        double lat() {
            return latitude == null ? Double.NaN : latitude.doubleValue();
        }

        double lng() {
            return longitude == null ? Double.NaN : longitude.doubleValue();
        }

        String searchText() {
            return normalize(name + " " + address + " " + stopCode);
        }
    }
}
