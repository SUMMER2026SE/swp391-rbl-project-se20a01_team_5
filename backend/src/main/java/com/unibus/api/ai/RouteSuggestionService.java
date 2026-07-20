package com.unibus.api.ai;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.unibus.api.ai.AiDtos.AiAction;
import com.unibus.api.ai.AiDtos.RouteSuggestionCard;
import com.unibus.api.ai.AiDtos.RouteSuggestionRequest;
import com.unibus.api.ai.AiKnowledgeRepository.RegistrationSnapshot;
import com.unibus.api.ai.AiKnowledgeRepository.RouteCandidate;
import com.unibus.api.ai.AiKnowledgeRepository.StudentContext;

@Service
public class RouteSuggestionService {

    private static final Pattern ROUTE_CODE = Pattern.compile("(?iu)\\btuyến\\s*0*([0-9]+)\\b");

    private final AiKnowledgeRepository knowledgeRepository;

    public RouteSuggestionService(AiKnowledgeRepository knowledgeRepository) {
        this.knowledgeRepository = knowledgeRepository;
    }

    public List<RouteSuggestionCard> suggest(Integer userId, RouteSuggestionRequest request) {
        StudentContext student = knowledgeRepository.studentContext(userId);
        RegistrationSnapshot registration = knowledgeRepository.currentRegistration(student.studentCode()).orElse(null);
        LocalTime preferredTime = parseTime(request == null ? null : request.preferredDepartureTime());
        Preference preference = Preference.from(request);
        Integer boardingStopId = request == null ? null : request.boardingStopId();
        Integer alightingStopId = request == null ? null : request.alightingStopId();
        boolean requiresDirectMatch = boardingStopId != null && alightingStopId != null;
        return knowledgeRepository.candidateRoutes(student).stream()
                .map(route -> score(route, registration, boardingStopId, alightingStopId, preferredTime, preference))
                .filter(card -> !requiresDirectMatch || matchesRequestedStops(card, boardingStopId, alightingStopId))
                .sorted(Comparator.comparing(RouteSuggestionCard::score).reversed()
                        .thenComparing(RouteSuggestionCard::routeName))
                .limit(5)
                .toList();
    }

    public Optional<RouteSuggestionCard> findByRouteId(Integer userId, Integer routeId) {
        if (routeId == null) {
            return Optional.empty();
        }
        StudentContext student = knowledgeRepository.studentContext(userId);
        RegistrationSnapshot registration = knowledgeRepository.currentRegistration(student.studentCode()).orElse(null);
        return knowledgeRepository.candidateRoutes(student).stream()
                .filter(route -> routeId.equals(route.routeId()))
                .findFirst()
                .map(route -> score(route, registration, null, null, null, new Preference(false, false, false)));
    }

    public Optional<RouteSuggestionCard> findByReference(Integer userId, Integer routeId, String message) {
        Optional<RouteSuggestionCard> selected = findByRouteId(userId, routeId);
        if (selected.isPresent()) {
            return selected;
        }
        Matcher matcher = ROUTE_CODE.matcher(message == null ? "" : message);
        if (!matcher.find()) {
            return Optional.empty();
        }
        int requestedCode = Integer.parseInt(matcher.group(1));
        StudentContext student = knowledgeRepository.studentContext(userId);
        RegistrationSnapshot registration = knowledgeRepository.currentRegistration(student.studentCode()).orElse(null);
        return knowledgeRepository.candidateRoutes(student).stream()
                .filter(route -> numericRouteCode(route.routeCode()) == requestedCode)
                .findFirst()
                .map(route -> score(route, registration, null, null, null, new Preference(false, false, false)));
    }

    private int numericRouteCode(String value) {
        if (value == null) return -1;
        Matcher matcher = Pattern.compile("[0-9]+").matcher(value);
        return matcher.find() ? Integer.parseInt(matcher.group()) : -1;
    }

    private RouteSuggestionCard score(
            RouteCandidate route,
            RegistrationSnapshot registration,
            Integer boardingStopId,
            Integer alightingStopId,
            LocalTime preferredTime,
            Preference preference) {
        List<String> reasons = new ArrayList<>();
        double score = 20;
        if (route.universityLinked()) {
            score += 25;
            reasons.add("Tuyến liên kết với trường của bạn");
        }
        StopMatch match = stopMatch(route, boardingStopId, alightingStopId);
        if (match.direct()) {
            score += 35;
            reasons.add("Đi qua đúng trạm lên và trạm xuống");
        } else if (boardingStopId != null || alightingStopId != null) {
            score -= 30;
            reasons.add("Không đi qua đủ hai trạm");
        }
        if (registration != null && registration.routeId().equals(route.routeId())) {
            score += 10;
            reasons.add("Trùng tuyến bạn đang đăng ký");
        }
        if (route.frequencyMin() != null && route.frequencyMin() > 0) {
            score += Math.max(0, 30 - route.frequencyMin()) * (preference.fast ? 0.9 : 0.45);
            if (route.frequencyMin() <= 15) {
                reasons.add("Tần suất chuyến cao");
            }
        }
        if (route.estimatedMinutes() != null) {
            score += Math.max(0, 75 - route.estimatedMinutes()) * (preference.fast ? 0.7 : 0.35);
            if (route.estimatedMinutes() <= 30) {
                reasons.add("Thời gian di chuyển ngắn");
            }
        }
        if (route.finalFare() != null && route.finalFare().compareTo(BigDecimal.ZERO) > 0) {
            double fareBonus = Math.max(0, 250000 - route.finalFare().doubleValue()) / 10000;
            score += preference.cheap ? fareBonus * 1.5 : fareBonus * 0.5;
        }
        if (route.subsidyAmount() != null && route.subsidyAmount().compareTo(BigDecimal.ZERO) > 0) {
            score += 12;
            reasons.add("Có trợ giá cho sinh viên");
        }
        if (preference.fewerStops && route.stops() != null) {
            score += Math.max(0, 15 - route.stops().size());
        }
        List<String> nextDepartures = knowledgeRepository.departureTimes(route.routeId(), preferredTime);
        if (!nextDepartures.isEmpty()) {
            score += 8;
            reasons.add("Có chuyến gần khung giờ bạn cần");
        }
        int confidence = Math.max(45, Math.min(98, (int) Math.round(score)));
        List<AiAction> actions = List.of(
                new AiAction("REGISTER_ROUTE", "Đăng ký tuyến", route.routeId(), boardingStopId, alightingStopId),
                new AiAction("BUY_MONTHLY_PASS", "Mua vé tháng", route.routeId(), boardingStopId, alightingStopId),
                new AiAction("VIEW_ETA", "Xem ETA", route.routeId(), boardingStopId, alightingStopId));
        return new RouteSuggestionCard(
                route.routeId(),
                route.routeCode(),
                route.routeName(),
                BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP),
                confidence,
                reasons.stream().distinct().toList(),
                route.stops(),
                nextDepartures,
                route.singleFare(),
                route.monthlyFare(),
                route.subsidyAmount(),
                route.finalFare(),
                actions);
    }

    private boolean matchesRequestedStops(RouteSuggestionCard card, Integer boardingStopId, Integer alightingStopId) {
        StopMatch match = stopMatch(card.stops(), boardingStopId, alightingStopId);
        return match.direct();
    }

    private StopMatch stopMatch(RouteCandidate route, Integer boardingStopId, Integer alightingStopId) {
        return stopMatch(route.stops(), boardingStopId, alightingStopId);
    }

    private StopMatch stopMatch(List<AiDtos.RouteStopCard> stops, Integer boardingStopId, Integer alightingStopId) {
        if (boardingStopId == null && alightingStopId == null) {
            return new StopMatch(false);
        }
        Integer boardingOrder = null;
        Integer alightingOrder = null;
        for (AiDtos.RouteStopCard stop : stops == null ? List.<AiDtos.RouteStopCard>of() : stops) {
            if (boardingStopId != null && boardingStopId.equals(stop.stopId())) {
                boardingOrder = stop.stopOrder();
            }
            if (alightingStopId != null && alightingStopId.equals(stop.stopId())) {
                alightingOrder = stop.stopOrder();
            }
        }
        if (boardingStopId != null && alightingStopId != null) {
            return new StopMatch(boardingOrder != null && alightingOrder != null && alightingOrder > boardingOrder);
        }
        return new StopMatch(boardingOrder != null || alightingOrder != null);
    }

    private LocalTime parseTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalTime.parse(value.trim());
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private record StopMatch(boolean direct) {
    }

    private record Preference(boolean fast, boolean cheap, boolean fewerStops) {
        static Preference from(RouteSuggestionRequest request) {
            String joined = "";
            if (request != null) {
                List<String> values = new ArrayList<>();
                if (request.preferences() != null) {
                    values.addAll(request.preferences());
                }
                values.add(nullToBlank(request.preference()));
                values.add(nullToBlank(request.naturalLanguageQuery()));
                joined = String.join(" ", values).toLowerCase(Locale.ROOT);
            }
            boolean fast = joined.contains("fast") || joined.contains("nhanh") || joined.contains("sớm");
            boolean cheap = joined.contains("cheap") || joined.contains("rẻ") || joined.contains("tiết kiệm");
            boolean fewerStops = joined.contains("fewer") || joined.contains("ít trạm") || joined.contains("ít dừng");
            return new Preference(fast, cheap, fewerStops);
        }

        private static String nullToBlank(String value) {
            return value == null ? "" : value;
        }
    }
}
