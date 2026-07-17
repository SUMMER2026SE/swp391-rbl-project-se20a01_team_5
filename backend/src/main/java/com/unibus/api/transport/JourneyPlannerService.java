package com.unibus.api.transport;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.transport.dto.TransportDtos.Coordinate;
import com.unibus.api.transport.dto.TransportDtos.JourneyAction;
import com.unibus.api.transport.dto.TransportDtos.JourneyLeg;
import com.unibus.api.transport.dto.TransportDtos.JourneyOption;
import com.unibus.api.transport.dto.TransportDtos.JourneySearchRequest;
import com.unibus.api.transport.dto.TransportDtos.JourneyStop;
import com.unibus.api.transport.dto.TransportDtos.JourneySummary;
import com.unibus.api.transport.dto.TransportDtos.MapPolyline;
import com.unibus.api.transport.dto.TransportDtos.PlacePoint;
import com.unibus.api.transport.dto.TransportDtos.RouteReference;
import com.unibus.api.university.SubsidyService;

@Service
public class JourneyPlannerService {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final int NEAR_STOP_RADIUS_M = 1_700;
    private static final int MAX_ACCESS_WALK_M = 1_600;
    private static final int MAX_TOTAL_WALK_M = 3_200;
    private static final int TRANSFER_WALK_RADIUS_M = 300;
    private static final int PREFERRED_TOTAL_WALK_M = 1_800;
    private static final int MAX_OPTIONS = 4;

    private final JdbcTemplate jdbcTemplate;
    private final SubsidyService subsidyService;
    private final Map<String, JourneyOption> optionCache = new java.util.concurrent.ConcurrentHashMap<>();

    public JourneyPlannerService(JdbcTemplate jdbcTemplate, SubsidyService subsidyService) {
        this.jdbcTemplate = jdbcTemplate;
        this.subsidyService = subsidyService;
    }

    @Transactional(readOnly = true)
    public List<JourneyOption> search(CurrentUser currentUser, JourneySearchRequest request) {
        if (request == null || request.origin() == null || request.destination() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Origin and destination are required");
        }
        int maxBusLegs = request.maxBusLegs() == null ? 2 : Math.max(1, Math.min(3, request.maxBusLegs()));
        ResolvedPoint origin = resolvePoint(request.origin(), "origin");
        ResolvedPoint destination = resolvePoint(request.destination(), "destination");
        if (origin.distanceTo(destination) < 80) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Origin and destination are too close");
        }

        Set<Integer> linkedRouteIds = subsidyService.activeLinkedRouteIds(currentUser);
        List<RouteLine> lines = loadRouteLines(linkedRouteIds);
        if (lines.isEmpty()) {
            return List.of();
        }
        List<StopNode> allStops = lines.stream()
                .flatMap(line -> line.stops().stream())
                .map(RouteStopNode::stop)
                .collect(java.util.stream.Collectors.toMap(
                        StopNode::stopId,
                        stop -> stop,
                        (left, right) -> left,
                        LinkedHashMap::new))
                .values()
                .stream()
                .toList();
        List<StopNode> originStops = nearestStops(origin, allStops, NEAR_STOP_RADIUS_M);
        List<StopNode> destinationStops = nearestStops(destination, allStops, NEAR_STOP_RADIUS_M);
        if (originStops.isEmpty() || destinationStops.isEmpty()) {
            return List.of();
        }

        List<JourneyOption> options = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        addDirectLineOptions(options, seen, lines, origin, destination, request.departAt());
        if (maxBusLegs >= 2) {
            List<StopNode> transferOriginStops = originStops.stream().limit(8).toList();
            List<StopNode> transferDestinationStops = destinationStops.stream().limit(8).toList();
            for (StopNode from : transferOriginStops) {
                for (StopNode to : transferDestinationStops) {
                    addTwoLegOptions(options, seen, lines, origin, destination, from, to, request.departAt());
                }
            }
        }
        List<JourneyOption> sorted = bestDistinctOptions(options, maxBusLegs);
        sorted.forEach(option -> optionCache.put(option.optionId(), option));
        return sorted;
    }

    Optional<JourneyOption> cachedOption(String optionId) {
        return Optional.ofNullable(optionCache.get(optionId));
    }

    private void addDirectOptions(List<JourneyOption> options, Set<String> seen, List<RouteLine> lines,
            ResolvedPoint origin, ResolvedPoint destination, StopNode from, StopNode to, OffsetDateTime departAt) {
        for (RouteLine line : lines) {
            Segment segment = segment(line, from.stopId(), to.stopId());
            if (segment != null) {
                addOption(options, seen, origin, destination, List.of(segment), departAt);
            }
        }
    }

    private void addDirectLineOptions(List<JourneyOption> options, Set<String> seen, List<RouteLine> lines,
            ResolvedPoint origin, ResolvedPoint destination, OffsetDateTime departAt) {
        for (RouteLine line : lines) {
            List<StopNode> originCandidates = nearestStopsOnLine(origin, line, MAX_ACCESS_WALK_M, 4);
            List<StopNode> destinationCandidates = nearestStopsOnLine(destination, line, MAX_ACCESS_WALK_M, 4);
            for (StopNode from : originCandidates) {
                for (StopNode to : destinationCandidates) {
                    Segment segment = segment(line, from.stopId(), to.stopId());
                    if (segment != null) {
                        addOption(options, seen, origin, destination, List.of(segment), departAt);
                    }
                }
            }
        }
    }

    private void addTwoLegOptions(List<JourneyOption> options, Set<String> seen, List<RouteLine> lines,
            ResolvedPoint origin, ResolvedPoint destination, StopNode from, StopNode to, OffsetDateTime departAt) {
        for (RouteLine firstLine : lines) {
            int fromIndex = firstLine.indexOf(from.stopId());
            if (fromIndex < 0) {
                continue;
            }
            for (int transferIndex = fromIndex + 1; transferIndex < firstLine.stops().size(); transferIndex++) {
                RouteStopNode transfer = firstLine.stops().get(transferIndex);
                Segment firstSegment = segment(firstLine, from.stopId(), transfer.stop().stopId());
                if (firstSegment == null) {
                    continue;
                }
                for (RouteLine secondLine : lines) {
                    if (secondLine.routeId().equals(firstLine.routeId()) && secondLine.direction() == firstLine.direction()) {
                        continue;
                    }
                    Segment secondSegment = segment(secondLine, transfer.stop().stopId(), to.stopId());
                    if (secondSegment != null) {
                        addOption(options, seen, origin, destination, List.of(firstSegment, secondSegment), departAt);
                        continue;
                    }
                    StopNode nearbyTransfer = nearestStopOnLine(transfer.stop(), secondLine, TRANSFER_WALK_RADIUS_M);
                    if (nearbyTransfer != null) {
                        secondSegment = segment(secondLine, nearbyTransfer.stopId(), to.stopId());
                        if (secondSegment != null) {
                            addOption(options, seen, origin, destination, List.of(firstSegment, secondSegment), departAt);
                        }
                    }
                }
            }
        }
    }

    private void addOption(List<JourneyOption> options, Set<String> seen, ResolvedPoint origin,
            ResolvedPoint destination, List<Segment> busSegments, OffsetDateTime departAt) {
        String key = busSegments.stream()
                .map(segment -> segment.line().routeId() + ":" + segment.from().stop().stopId() + "-" + segment.to().stop().stopId())
                .collect(java.util.stream.Collectors.joining("|"));
        if (!seen.add(key)) {
            return;
        }
        JourneyOption option = buildOption(origin, destination, busSegments, departAt);
        if (option != null) {
            options.add(option);
        }
    }

    private List<JourneyOption> bestDistinctOptions(List<JourneyOption> options, int maxBusLegs) {
        Map<String, JourneyOption> bestByRouteSequence = new LinkedHashMap<>();
        options.stream()
                .sorted(journeyComparator())
                .forEach(option -> bestByRouteSequence.putIfAbsent(journeySignature(option), option));
        List<JourneyOption> distinct = bestByRouteSequence.values().stream().toList();
        List<JourneyOption> direct = distinct.stream()
                .filter(option -> option.summary().transferCount() == null || option.summary().transferCount() == 0)
                .limit(MAX_OPTIONS)
                .toList();
        List<JourneyOption> transfer = distinct.stream()
                .filter(option -> option.summary().transferCount() != null && option.summary().transferCount() > 0)
                .limit(MAX_OPTIONS)
                .toList();
        if (maxBusLegs >= 2 && !transfer.isEmpty()) {
            List<JourneyOption> result = new ArrayList<>();
            direct.stream().limit(2).forEach(result::add);
            transfer.stream()
                    .filter(option -> result.stream().noneMatch(existing -> journeySignature(existing).equals(journeySignature(option))))
                    .forEach(result::add);
            return result.stream().limit(MAX_OPTIONS).toList();
        }
        return direct.isEmpty()
                ? distinct.stream().limit(MAX_OPTIONS).toList()
                : direct.stream().limit(MAX_OPTIONS).toList();
    }

    private Comparator<JourneyOption> journeyComparator() {
        return Comparator
                .comparingDouble(this::journeyScore)
                .thenComparingInt((JourneyOption option) -> option.summary().totalMinutes())
                .thenComparing(option -> option.summary().transferCount())
                .thenComparing(option -> option.summary().walkMeters());
    }

    private double journeyScore(JourneyOption option) {
        int totalMinutes = option.summary().totalMinutes() == null ? 0 : option.summary().totalMinutes();
        int transfers = option.summary().transferCount() == null ? 0 : option.summary().transferCount();
        int walkMinutes = option.summary().walkMinutes() == null ? 0 : option.summary().walkMinutes();
        int walkMeters = option.summary().walkMeters() == null ? 0 : option.summary().walkMeters().intValue();
        double longWalkPenalty = Math.max(0, walkMeters - PREFERRED_TOTAL_WALK_M) / 80.0;
        double aliasRoutePenalty = option.legs().stream()
                .filter(leg -> "BUS".equals(leg.mode()))
                .filter(leg -> isAliasRouteCode(leg.routeCode()))
                .count() * 10.0;
        double confidencePenalty = switch (String.valueOf(option.summary().confidence())) {
            case "LOW" -> 12.0;
            case "MEDIUM" -> 4.0;
            default -> 0.0;
        };
        return totalMinutes + transfers * 12.0 + walkMinutes * 0.75
                + longWalkPenalty + aliasRoutePenalty + confidencePenalty;
    }

    private String journeySignature(JourneyOption option) {
        String routeSequence = option.legs().stream()
                .filter(leg -> "BUS".equals(leg.mode()))
                .map(leg -> canonicalRouteCode(leg.routeCode(), leg.routeId()))
                .collect(java.util.stream.Collectors.joining(">"));
        return routeSequence.isBlank() ? option.optionId() : routeSequence;
    }

    private String canonicalRouteCode(String routeCode, Integer routeId) {
        if (routeCode == null || routeCode.isBlank()) {
            return String.valueOf(routeId);
        }
        String normalized = routeCode.trim().toUpperCase(Locale.ROOT);
        return isAliasRouteCode(normalized) ? normalized.substring(1) : normalized;
    }

    private boolean isAliasRouteCode(String routeCode) {
        if (routeCode == null) {
            return false;
        }
        return routeCode.trim().toUpperCase(Locale.ROOT).matches("^R\\d+[A-Z]?$");
    }

    private String legDirection(JourneyLeg leg) {
        if (leg.stops() == null || leg.stops().isEmpty() || leg.stops().get(0).stationDirection() == null) {
            return "x";
        }
        return String.valueOf(leg.stops().get(0).stationDirection());
    }

    private JourneyOption buildOption(ResolvedPoint origin, ResolvedPoint destination,
            List<Segment> busSegments, OffsetDateTime departAt) {
        List<JourneyLeg> legs = new ArrayList<>();
        List<MapPolyline> polylines = new ArrayList<>();
        List<JourneyStop> allStops = new ArrayList<>();
        int legIndex = 0;
        int totalWalkMeters = 0;
        int totalWalkMinutes = 0;
        int totalWaitMinutes = 0;
        int totalBusMinutes = 0;
        int totalTransferMinutes = 0;
        BigDecimal singleFare = BigDecimal.ZERO;
        BigDecimal monthlyFare = BigDecimal.ZERO;
        OffsetDateTime journeyStartAt = departAt == null ? OffsetDateTime.now(VIETNAM_ZONE) : departAt;
        OffsetDateTime rollingDepartAt = journeyStartAt;

        Segment first = busSegments.get(0);
        int firstWalk = origin.distanceTo(first.from().stop());
        if (firstWalk > MAX_ACCESS_WALK_M) {
            return null;
        }
        if (firstWalk > 50) {
            JourneyLeg walk = walkingLeg("walk-origin", origin.label(), first.from().stop().name(),
                    origin.lat(), origin.lng(), first.from().stop().lat(), first.from().stop().lng(), firstWalk,
                    rollingDepartAt);
            legs.add(walk);
            polylines.add(new MapPolyline(walk.legId(), "WALK", "#64748b", walk.shape()));
            totalWalkMeters += firstWalk;
            totalWalkMinutes += walk.durationMinutes();
            rollingDepartAt = walk.estimatedArrivalAt();
        }

        for (int segmentIndex = 0; segmentIndex < busSegments.size(); segmentIndex++) {
            Segment segment = busSegments.get(segmentIndex);
            if (segmentIndex > 0) {
                Segment previous = busSegments.get(segmentIndex - 1);
                int transferWalk = previous.to().stop().distanceTo(segment.from().stop());
                if (transferWalk > 50) {
                    JourneyLeg walk = walkingLeg("walk-transfer-" + segmentIndex,
                            previous.to().stop().name(), segment.from().stop().name(),
                            previous.to().stop().lat(), previous.to().stop().lng(),
                            segment.from().stop().lat(), segment.from().stop().lng(),
                            transferWalk, rollingDepartAt);
                    legs.add(walk);
                    polylines.add(new MapPolyline(walk.legId(), "WALK", "#64748b", walk.shape()));
                    totalWalkMeters += transferWalk;
                    totalWalkMinutes += walk.durationMinutes();
                    rollingDepartAt = walk.estimatedArrivalAt();
                } else {
                    totalTransferMinutes += 4;
                    rollingDepartAt = rollingDepartAt.plusMinutes(4);
                }
            }
            JourneyLeg busLeg = busLeg("bus-" + (++legIndex), segment, rollingDepartAt);
            if (busLeg == null) {
                return null;
            }
            legs.add(busLeg);
            polylines.add(new MapPolyline(busLeg.legId(), "BUS", busLeg.colorHex(), busLeg.shape()));
            allStops.addAll(busLeg.stops());
            totalWaitMinutes += busLeg.waitMinutes() == null ? 0 : busLeg.waitMinutes();
            totalBusMinutes += busLeg.durationMinutes() == null ? 0 : busLeg.durationMinutes();
            singleFare = singleFare.add(segment.line().singleFare());
            monthlyFare = monthlyFare.add(segment.line().monthlyFare());
            rollingDepartAt = busLeg.estimatedArrivalAt() == null ? rollingDepartAt.plusMinutes(busLeg.durationMinutes()) : busLeg.estimatedArrivalAt();
        }

        Segment last = busSegments.get(busSegments.size() - 1);
        int lastWalk = destination.distanceTo(last.to().stop());
        if (lastWalk > MAX_ACCESS_WALK_M) {
            return null;
        }
        if (lastWalk > 50) {
            JourneyLeg walk = walkingLeg("walk-destination", last.to().stop().name(), destination.label(),
                    last.to().stop().lat(), last.to().stop().lng(), destination.lat(), destination.lng(), lastWalk,
                    rollingDepartAt);
            legs.add(walk);
            polylines.add(new MapPolyline(walk.legId(), "WALK", "#64748b", walk.shape()));
            totalWalkMeters += lastWalk;
            totalWalkMinutes += walk.durationMinutes();
            rollingDepartAt = walk.estimatedArrivalAt();
        }
        if (totalWalkMeters > MAX_TOTAL_WALK_M) {
            return null;
        }

        List<RouteReference> routeBadges = busSegments.stream()
                .map(segment -> new RouteReference(segment.line().routeId(), segment.line().routeName(),
                        segment.line().routeCode(), segment.line().colorHex()))
                .distinct()
                .toList();
        JourneyAction registerAction = primaryAction(busSegments);
        List<JourneyAction> secondaryActions = List.of(
                new JourneyAction("TRACK", "Theo dõi xe", true, null,
                        first.line().routeId(), first.from().stop().stopId(), first.to().stop().stopId()),
                new JourneyAction("DETAIL", "Xem các trạm", true, null,
                        first.line().routeId(), first.from().stop().stopId(), first.to().stop().stopId()));
        int totalMinutes = Math.max(1, (int) Duration.between(journeyStartAt, rollingDepartAt).toMinutes());
        JourneySummary summary = new JourneySummary(
                totalMinutes,
                totalWalkMinutes,
                totalWaitMinutes + totalTransferMinutes,
                BigDecimal.valueOf(totalWalkMeters),
                busSegments.stream().map(segment -> segment.distanceKm()).reduce(BigDecimal.ZERO, BigDecimal::add),
                Math.max(0, busSegments.size() - 1),
                singleFare,
                monthlyFare,
                totalWaitMinutes <= 1 ? "xe sắp tới" : "xe tới trong " + totalWaitMinutes + " phút",
                confidence(busSegments, totalWalkMeters));
        String optionId = "J-" + Math.abs(Objects.hash(
                origin.label(), destination.label(), routeBadges.toString(), totalMinutes, totalWalkMeters));
        return new JourneyOption(optionId, summary, legs, routeBadges, registerAction, secondaryActions,
                polylines, compactStops(allStops));
    }

    private JourneyLeg busLeg(String legId, Segment segment, OffsetDateTime departAt) {
        OffsetDateTime nextDeparture = nextDeparture(segment.line(), departAt);
        if (nextDeparture == null) {
            return null;
        }
        int wait = (int) Duration.between(departAt, nextDeparture).toMinutes();
        int ride = segment.durationMinutes();
        OffsetDateTime arrival = nextDeparture.plusMinutes(ride);
        List<JourneyStop> stops = new ArrayList<>();
        int hopCount = Math.max(1, segment.toIndex() - segment.fromIndex());
        for (int i = segment.fromIndex(); i <= segment.toIndex(); i++) {
            RouteStopNode routeStop = segment.line().stops().get(i);
            double progress = (i - segment.fromIndex()) / (double) hopCount;
            int eta = wait + (int) Math.round(ride * progress);
            stops.add(new JourneyStop(
                    routeStop.stop().stopId(),
                    routeStop.stop().name(),
                    routeStop.stop().address(),
                    PlaceService.bd(routeStop.stop().lat()),
                    PlaceService.bd(routeStop.stop().lng()),
                    routeStop.order(),
                    routeStop.direction(),
                    eta,
                    i == segment.fromIndex() || i == segment.toIndex()));
        }
        return new JourneyLeg(
                legId,
                "BUS",
                segment.line().routeId(),
                segment.line().routeCode(),
                segment.line().routeName(),
                segment.line().colorHex(),
                segment.from().stop().stopId(),
                segment.from().stop().name(),
                segment.to().stop().stopId(),
                segment.to().stop().name(),
                stops.size(),
                ride,
                wait,
                segment.distanceKm(),
                segment.line().singleFare(),
                nextDeparture,
                arrival,
                stops,
                segmentShape(segment),
                segment.line().universityLinked());
    }

    private JourneyLeg walkingLeg(String legId, String fromLabel, String toLabel,
            double fromLat, double fromLng, double toLat, double toLng, int meters, OffsetDateTime startAt) {
        int minutes = Math.max(1, (int) Math.ceil(meters / 75.0));
        OffsetDateTime arrivalAt = startAt == null ? null : startAt.plusMinutes(minutes);
        List<Coordinate> shape = List.of(
                new Coordinate(PlaceService.bd(fromLat), PlaceService.bd(fromLng)),
                new Coordinate(PlaceService.bd(toLat), PlaceService.bd(toLng)));
        return new JourneyLeg(
                legId,
                "WALK",
                null,
                null,
                "Đi bộ",
                "#64748b",
                null,
                fromLabel,
                null,
                toLabel,
                null,
                minutes,
                0,
                BigDecimal.valueOf(meters).divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP),
                BigDecimal.ZERO,
                startAt,
                arrivalAt,
                List.of(),
                shape,
                false);
    }

    private JourneyAction primaryAction(List<Segment> busSegments) {
        Segment first = busSegments.get(0);
        boolean subsidized = first.line().universityLinked();
        String message = subsidized ? "Tuyến được trường của bạn hỗ trợ." : "Tuyến này chưa có trợ giá từ trường của bạn.";
        return new JourneyAction("REGISTER_ROUTE", "Đăng ký tuyến " + first.line().routeCode(), true,
                subsidized ? null : message, first.line().routeId(), first.from().stop().stopId(), first.to().stop().stopId(),
                subsidized, subsidized, true, subsidized ? "SUBSIDIZED" : "FULL_PRICE", message);
    }

    private List<JourneyStop> compactStops(List<JourneyStop> stops) {
        Map<Integer, JourneyStop> unique = new LinkedHashMap<>();
        for (JourneyStop stop : stops) {
            unique.putIfAbsent(stop.stopId(), stop);
        }
        return new ArrayList<>(unique.values());
    }

    private List<Coordinate> segmentShape(Segment segment) {
        List<Coordinate> points = new ArrayList<>();
        addPoint(points, segment.from().stop().lat(), segment.from().stop().lng());
        for (int i = segment.fromIndex() + 1; i <= segment.toIndex(); i++) {
            RouteStopNode routeStop = segment.line().stops().get(i);
            parsePathPoints(routeStop.pathPoints(), points);
            addPoint(points, routeStop.stop().lat(), routeStop.stop().lng());
        }
        if (points.size() < 2) {
            addPoint(points, segment.to().stop().lat(), segment.to().stop().lng());
        }
        return points;
    }

    private void parsePathPoints(String pathPoints, List<Coordinate> points) {
        if (pathPoints == null || pathPoints.isBlank()) {
            return;
        }
        String[] pairs = pathPoints.trim().split("\\s+");
        for (String pair : pairs) {
            String[] lngLat = pair.split(",");
            if (lngLat.length != 2) {
                continue;
            }
            try {
                double lng = Double.parseDouble(lngLat[0]);
                double lat = Double.parseDouble(lngLat[1]);
                addPoint(points, lat, lng);
            } catch (NumberFormatException ignored) {
                // Skip malformed source points and continue with stop geometry.
            }
        }
    }

    private void addPoint(List<Coordinate> points, double lat, double lng) {
        if (Double.isNaN(lat) || Double.isNaN(lng)) {
            return;
        }
        Coordinate next = new Coordinate(PlaceService.bd(lat), PlaceService.bd(lng));
        if (points.isEmpty() || !points.get(points.size() - 1).equals(next)) {
            points.add(next);
        }
    }

    private String confidence(List<Segment> segments, int walkMeters) {
        if (segments.stream().allMatch(segment -> !segmentShape(segment).isEmpty()) && walkMeters <= 900) {
            return "HIGH";
        }
        return walkMeters <= 1_500 ? "MEDIUM" : "LOW";
    }

    private OffsetDateTime nextDeparture(RouteLine line, OffsetDateTime requestedAt) {
        Optional<LocalTime> firstTrip = line.firstTrip();
        Optional<LocalTime> lastTrip = line.lastTrip();
        if (firstTrip.isEmpty() || lastTrip.isEmpty()) {
            return requestedAt.plusMinutes(Math.max(1, line.frequencyMin() == null ? 15 : line.frequencyMin()));
        }
        var localDate = requestedAt.atZoneSameInstant(VIETNAM_ZONE).toLocalDate();
        var first = localDate.atTime(firstTrip.get()).atZone(VIETNAM_ZONE).toOffsetDateTime();
        var last = localDate.atTime(lastTrip.get()).atZone(VIETNAM_ZONE).toOffsetDateTime();
        if (requestedAt.isAfter(last)) {
            return first.plusDays(1);
        }
        if (!requestedAt.isAfter(first)) {
            return first;
        }
        int headway = line.frequencyMin() == null || line.frequencyMin() <= 0 ? 15 : line.frequencyMin();
        long elapsed = Duration.between(first, requestedAt).toMinutes();
        long intervals = (elapsed + headway - 1) / headway;
        OffsetDateTime next = first.plusMinutes(intervals * headway);
        return next.isAfter(last) ? first.plusDays(1) : next;
    }

    private Segment segment(RouteLine line, Integer fromStopId, Integer toStopId) {
        int fromIndex = line.indexOf(fromStopId);
        int toIndex = line.indexOf(toStopId);
        if (fromIndex < 0 || toIndex <= fromIndex) {
            return null;
        }
        return new Segment(line, fromIndex, toIndex);
    }

    private StopNode nearestStopOnLine(StopNode target, RouteLine line, int radiusMeters) {
        return line.stops().stream()
                .map(RouteStopNode::stop)
                .filter(stop -> !stop.stopId().equals(target.stopId()))
                .filter(stop -> target.distanceTo(stop) <= radiusMeters)
                .min(Comparator.comparingInt(target::distanceTo))
                .orElse(null);
    }

    private List<StopNode> nearestStopsOnLine(ResolvedPoint point, RouteLine line, int radiusMeters, int limit) {
        return line.stops().stream()
                .map(RouteStopNode::stop)
                .distinct()
                .filter(stop -> point.distanceTo(stop) <= radiusMeters)
                .sorted(Comparator.comparingInt(point::distanceTo))
                .limit(limit)
                .toList();
    }

    private List<StopNode> nearestStops(ResolvedPoint point, List<StopNode> stops, int radiusMeters) {
        List<StopNode> withinRadius = stops.stream()
                .filter(stop -> point.distanceTo(stop) <= radiusMeters)
                .sorted(Comparator.comparingInt(point::distanceTo))
                .limit(32)
                .toList();
        if (!withinRadius.isEmpty()) {
            return withinRadius;
        }
        return stops.stream()
                .sorted(Comparator.comparingInt(point::distanceTo))
                .limit(8)
                .toList();
    }

    private ResolvedPoint resolvePoint(PlacePoint point, String fieldName) {
        if (point.stopId() != null) {
            List<ResolvedPoint> stops = jdbcTemplate.query("""
                    SELECT stop_id, stop_name, address, latitude, longitude
                    FROM stops
                    WHERE stop_id = ?
                    """, (rs, rowNum) -> new ResolvedPoint(
                            "stop:" + rs.getInt("stop_id"),
                            rs.getString("stop_name"),
                            rs.getBigDecimal("latitude").doubleValue(),
                            rs.getBigDecimal("longitude").doubleValue()), point.stopId());
            if (!stops.isEmpty()) {
                return stops.get(0);
            }
        }
        if (point.latitude() == null || point.longitude() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, fieldName + " must include a stopId or coordinates");
        }
        String label = point.label() == null || point.label().isBlank() ? "Vị trí đã chọn" : point.label();
        return new ResolvedPoint(point.placeId(), label, point.latitude().doubleValue(), point.longitude().doubleValue());
    }

    private List<RouteLine> loadRouteLines(Set<Integer> linkedRouteIds) {
        List<RouteRow> rows = jdbcTemplate.query("""
                SELECT r.route_id, r.route_name, r.route_code, r.color_hex, r.frequency_min,
                       r.estimated_minutes, r.distance_km, r.description,
                       COALESCE(rs.station_direction, 0) AS station_direction,
                       rs.stop_order, rs.minutes_from_previous_stop, rs.path_points,
                       s.stop_id, s.stop_name, s.address, s.latitude, s.longitude,
                       COALESCE((
                           SELECT amount
                           FROM fares f
                           WHERE f.route_id = r.route_id
                             AND f.fare_type = 'SINGLE'
                             AND f.effective_from <= CURRENT_DATE
                             AND (f.effective_until IS NULL OR f.effective_until >= CURRENT_DATE)
                           ORDER BY f.effective_from DESC
                           LIMIT 1
                       ), 0) AS single_fare,
                       COALESCE((
                           SELECT amount
                           FROM fares f
                           WHERE f.route_id = r.route_id
                             AND f.fare_type = 'MONTHLY'
                             AND f.effective_from <= CURRENT_DATE
                             AND (f.effective_until IS NULL OR f.effective_until >= CURRENT_DATE)
                           ORDER BY f.effective_from DESC
                           LIMIT 1
                       ), 0) AS monthly_fare
                FROM routes r
                JOIN route_stops rs ON rs.route_id = r.route_id
                JOIN stops s ON s.stop_id = rs.stop_id
                WHERE r.status = 'ACTIVE'
                  AND s.status = 'ACTIVE'
                  AND s.latitude IS NOT NULL
                  AND s.longitude IS NOT NULL
                  AND (
                      r.external_source = 'BUSMAP_DN'
                      OR NOT EXISTS (
                          SELECT 1
                          FROM routes official_routes
                          WHERE official_routes.external_source = 'BUSMAP_DN'
                            AND official_routes.status = 'ACTIVE'
                      )
                  )
                ORDER BY r.route_id, COALESCE(rs.station_direction, 0), rs.stop_order
                """, (rs, rowNum) -> new RouteRow(
                        rs.getInt("route_id"),
                        rs.getString("route_name"),
                        rs.getString("route_code"),
                        rs.getString("color_hex"),
                        (Integer) rs.getObject("frequency_min"),
                        (Integer) rs.getObject("estimated_minutes"),
                        rs.getBigDecimal("distance_km"),
                        rs.getString("description"),
                        rs.getInt("station_direction"),
                        rs.getInt("stop_order"),
                        (Integer) rs.getObject("minutes_from_previous_stop"),
                        rs.getString("path_points"),
                        rs.getInt("stop_id"),
                        rs.getString("stop_name"),
                        rs.getString("address"),
                        rs.getBigDecimal("latitude"),
                        rs.getBigDecimal("longitude"),
                        rs.getBigDecimal("single_fare"),
                        rs.getBigDecimal("monthly_fare")));
        Map<String, List<RouteRow>> grouped = new LinkedHashMap<>();
        for (RouteRow row : rows) {
            grouped.computeIfAbsent(row.routeId() + ":" + row.direction(), ignored -> new ArrayList<>()).add(row);
        }
        List<RouteLine> lines = new ArrayList<>();
        for (List<RouteRow> group : grouped.values()) {
            if (group.size() < 2) {
                continue;
            }
            RouteRow first = group.get(0);
            List<RouteStopNode> stops = group.stream()
                    .map(row -> new RouteStopNode(
                            new StopNode(row.stopId(), row.stopName(), row.address(),
                                    row.latitude().doubleValue(), row.longitude().doubleValue()),
                            row.order(),
                            row.direction(),
                            row.minutesFromPrevious(),
                            row.pathPoints()))
                    .toList();
            lines.add(new RouteLine(
                    first.routeId(),
                    first.routeName(),
                    first.routeCode() == null ? String.valueOf(first.routeId()) : first.routeCode(),
                    first.colorHex() == null ? colorForRoute(first.routeId()) : first.colorHex(),
                    first.frequencyMin(),
                    first.estimatedMinutes(),
                    first.distanceKm() == null ? BigDecimal.ZERO : first.distanceKm(),
                    first.singleFare() == null ? BigDecimal.ZERO : first.singleFare(),
                    first.monthlyFare() == null ? BigDecimal.ZERO : first.monthlyFare(),
                    first.description(),
                    first.direction(),
                    linkedRouteIds.contains(first.routeId()),
                    stops));
        }
        return lines;
    }

    private String colorForRoute(Integer routeId) {
        String[] palette = {"#144fcc", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"};
        return palette[Math.abs(routeId == null ? 0 : routeId) % palette.length];
    }

    private record ResolvedPoint(String id, String label, double lat, double lng) {
        int distanceTo(StopNode stop) {
            return PlaceService.meters(lat, lng, stop.lat(), stop.lng());
        }

        int distanceTo(ResolvedPoint point) {
            return PlaceService.meters(lat, lng, point.lat(), point.lng());
        }
    }

    private record StopNode(Integer stopId, String name, String address, double lat, double lng) {
        int distanceTo(StopNode stop) {
            return PlaceService.meters(lat, lng, stop.lat(), stop.lng());
        }
    }

    private record RouteStopNode(StopNode stop, int order, int direction,
            Integer minutesFromPrevious, String pathPoints) {
    }

    private record RouteLine(Integer routeId, String routeName, String routeCode, String colorHex,
            Integer frequencyMin, Integer estimatedMinutes, BigDecimal distanceKm,
            BigDecimal singleFare, BigDecimal monthlyFare, String description, int direction,
            boolean universityLinked, List<RouteStopNode> stops) {
        int indexOf(Integer stopId) {
            for (int i = 0; i < stops.size(); i++) {
                if (stops.get(i).stop().stopId().equals(stopId)) {
                    return i;
                }
            }
            return -1;
        }

        Optional<LocalTime> firstTrip() {
            return operationBound(0);
        }

        Optional<LocalTime> lastTrip() {
            return operationBound(1);
        }

        private Optional<LocalTime> operationBound(int index) {
            if (description == null) {
                return Optional.empty();
            }
            String[] parts = description.split("\\|");
            for (String part : parts) {
                String trimmed = part.trim().toLowerCase(Locale.ROOT);
                if (trimmed.startsWith("operationtime=")) {
                    String[] bounds = trimmed.substring("operationtime=".length()).split("-");
                    if (bounds.length > index) {
                        try {
                            return Optional.of(LocalTime.parse(bounds[index].trim()));
                        } catch (Exception ignored) {
                            return Optional.empty();
                        }
                    }
                }
            }
            return Optional.empty();
        }
    }

    private record Segment(RouteLine line, int fromIndex, int toIndex) {
        RouteStopNode from() {
            return line.stops().get(fromIndex);
        }

        RouteStopNode to() {
            return line.stops().get(toIndex);
        }

        int durationMinutes() {
            int hopCount = Math.max(1, toIndex - fromIndex);
            double kilometers = distanceKm().doubleValue();
            double averageSpeedKmh = kilometers < 3 ? 17.0 : 21.0;
            int movingMinutes = (int) Math.ceil((kilometers / averageSpeedKmh) * 60.0);
            int dwellMinutes = (int) Math.ceil(Math.max(0, hopCount - 1) * 0.45);
            return Math.max(4, Math.min(120, movingMinutes + dwellMinutes));
        }

        BigDecimal distanceKm() {
            double meters = 0;
            for (int i = fromIndex + 1; i <= toIndex; i++) {
                StopNode previous = line.stops().get(i - 1).stop();
                StopNode current = line.stops().get(i).stop();
                meters += previous.distanceTo(current);
            }
            return BigDecimal.valueOf(meters / 1000.0).setScale(2, RoundingMode.HALF_UP);
        }
    }

    private record RouteRow(Integer routeId, String routeName, String routeCode, String colorHex,
            Integer frequencyMin, Integer estimatedMinutes, BigDecimal distanceKm, String description,
            int direction, int order, Integer minutesFromPrevious, String pathPoints,
            Integer stopId, String stopName, String address, BigDecimal latitude, BigDecimal longitude,
            BigDecimal singleFare, BigDecimal monthlyFare) {
    }
}
