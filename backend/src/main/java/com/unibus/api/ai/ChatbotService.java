package com.unibus.api.ai;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unibus.api.ai.AiDtos.AiAction;
import com.unibus.api.ai.AiDtos.AiProviderStatus;
import com.unibus.api.ai.AiDtos.AiSource;
import com.unibus.api.ai.AiDtos.AiTraceEvent;
import com.unibus.api.ai.AiDtos.ChatRequest;
import com.unibus.api.ai.AiDtos.ChatResponse;
import com.unibus.api.ai.AiDtos.ChatStreamEvent;
import com.unibus.api.ai.AiDtos.RouteSuggestionCard;
import com.unibus.api.ai.AiDtos.RouteSuggestionRequest;
import com.unibus.api.ai.AiKnowledgeRepository.RegistrationSnapshot;
import com.unibus.api.ai.AiKnowledgeRepository.StudentContext;
import com.unibus.api.ai.AiKnowledgeRepository.TicketSnapshot;
import com.unibus.api.ai.AiLlmService.AiPrompt;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.transport.JourneyPlannerService;
import com.unibus.api.transport.PlaceService;
import com.unibus.api.transport.dto.TransportDtos.JourneyOption;
import com.unibus.api.transport.dto.TransportDtos.JourneySearchRequest;
import com.unibus.api.transport.dto.TransportDtos.PlacePoint;
import com.unibus.api.transport.dto.TransportDtos.PlaceSuggestion;
import com.unibus.api.user.model.UserRole;

@Service
public class ChatbotService {

    private static final Logger log = LoggerFactory.getLogger(ChatbotService.class);
    private static final List<Pattern> ROUTE_CONNECTORS = List.of(
            Pattern.compile("(?iu)\\s*,?\\s*(?:muốn|muon|cần|can)\\s+(?:đi\\s+|di\\s+)?(?:qua|đến|den|tới|toi|sang)\\s+"),
            Pattern.compile("(?iu)\\s+(?:đi\\s+|di\\s+)?(?:đến|den|tới|toi|sang)\\s+"));
    private static final Pattern ORIGIN_PREFIX = Pattern.compile(
            "(?iu)^\\s*(?:(?:tôi|toi)\\s+)?(?:đi\\s+từ|di\\s+tu|đang\\s+ở|dang\\s+o|xuất\\s+phát\\s+(?:từ|ở)|xuat\\s+phat\\s+(?:tu|o)|từ|tu|ở|o|gần|gan)\\s+");
    private static final Pattern DESTINATION_SUFFIX = Pattern.compile(
            "(?iu)\\s*(?:,|;|\\?|!|nên\\b|nen\\b|ưu tiên\\b|uu tien\\b|đi xe\\b|di xe\\b|đi sao\\b|di sao\\b|thế nào\\b|the nao\\b).*$");
    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private static final String SYSTEM_PROMPT = """
            Bạn là UniBus AI Copilot cho sinh viên.
            Chỉ trả lời dựa trên UniBus context JSON được backend cung cấp.
            Không bịa tuyến, trạm, lịch chạy, giá vé, trạng thái thanh toán hoặc chính sách trợ giá.
            Nếu context thiếu dữ liệu quan trọng, hãy hỏi lại ngắn gọn.
            Không sinh SQL, không yêu cầu quyền admin, không tự thực hiện đăng ký tuyến hoặc mua vé.
            Khi người dùng hỏi về ngày hiện tại, hôm nay, bây giờ hoặc thời gian tương đối, phải ưu tiên dùng currentDate/currentDateTime/currentTimezone trong context backend thay vì suy đoán.
            Nếu không chắc về mốc thời gian, hãy nêu ngày đầy đủ dạng dd/MM/yyyy.
            Trả về JSON thuần, không markdown, theo schema:
            {"message":"câu trả lời tiếng Việt","advisoryType":"ROUTE_SUGGESTION|FARE_LOOKUP|SCHEDULE_LOOKUP|PAYMENT_LOOKUP|VERIFICATION|HELP|OTHER"}
            """;

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final AiKnowledgeRepository knowledgeRepository;
    private final RouteSuggestionService routeSuggestionService;
    private final AiLlmService llmService;
    private final IntentRouter intentRouter;
    private final FastReplyService fastReplyService;
    private final PlaceService placeService;
    private final JourneyPlannerService journeyPlannerService;

    public ChatbotService(
            JdbcTemplate jdbcTemplate,
            AiKnowledgeRepository knowledgeRepository,
            RouteSuggestionService routeSuggestionService,
            AiLlmService llmService,
            IntentRouter intentRouter,
            FastReplyService fastReplyService,
            PlaceService placeService,
            JourneyPlannerService journeyPlannerService) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = new ObjectMapper();
        this.knowledgeRepository = knowledgeRepository;
        this.routeSuggestionService = routeSuggestionService;
        this.llmService = llmService;
        this.intentRouter = intentRouter;
        this.fastReplyService = fastReplyService;
        this.placeService = placeService;
        this.journeyPlannerService = journeyPlannerService;
    }

    @Transactional
    public ChatResponse respond(Integer userId, ChatRequest request) {
        return runConversation(userId, request, StreamSink.noop());
    }

    @Transactional
    public ChatResponse respondStream(Integer userId, ChatRequest request, StreamSink sink) {
        return runConversation(userId, request, sink == null ? StreamSink.noop() : sink);
    }

    private ChatResponse runConversation(Integer userId, ChatRequest request, StreamSink sink) {
        String userMessage = request.message() == null ? "" : request.message().trim();
        AiIntent detectedType = intentRouter.detect(userMessage);
        AiIntent advisoryType = detectedType == AiIntent.OTHER && hasStopPair(request.context())
                ? AiIntent.ROUTE_SUGGESTION
                : detectedType;
        RouteEndpoints parsedEndpoints = advisoryType == AiIntent.ROUTE_SUGGESTION ? routeEndpoints(userMessage) : null;
        if (parsedEndpoints != null && needsCampusClarification(parsedEndpoints)) {
            return quickResponse(sink, advisoryType,
                    "Bạn muốn đến Duy Tân 254 Nguyễn Văn Linh hay cơ sở khác?");
        }
        List<RouteSuggestionCard> journeyRoutes = advisoryType == AiIntent.ROUTE_SUGGESTION
                ? journeyRouteSuggestions(userId, userMessage, request, parsedEndpoints)
                : List.of();
        sink.emit("assistant.started", streamEvent("assistant.started", null, null, null,
                advisoryType, List.of(), List.of(), List.of(), List.of(), null, null));

        if (advisoryType == AiIntent.SMALL_TALK) {
            LlmMessage fastReply = new LlmMessage(
                    fastReplyService.reply(userMessage).orElse("Xin chào. Bạn muốn mình hỗ trợ gì về UniBus?"),
                    AiIntent.SMALL_TALK);
            String sessionId = UUID.randomUUID().toString();
            sink.emit("fast_reply", streamEvent("fast_reply", fastReply.message(), null,
                    "FAST_REPLY", fastReply.advisoryType(), List.of(), List.of(), List.of(), List.of(), null, sessionId));
            ChatResponse response = new ChatResponse(
                    fastReply.message(),
                    "FAST_REPLY",
                    fastReply.advisoryType().name(),
                    List.of(),
                    List.of(),
                    List.of(),
                    sessionId,
                    List.of(),
                    null);
            sink.emit("assistant.completed", streamEvent("assistant.completed", fastReply.message(), null,
                    "FAST_REPLY", fastReply.advisoryType(), List.of(), List.of(), List.of(), List.of(), null, sessionId));
            return response;
        }

        RouteSuggestionRequest routeRequest = journeyRoutes.isEmpty()
                ? routeRequestFromChat(userId, request, advisoryType)
                : new RouteSuggestionRequest(null, null, null, preferences(request), userMessage, null);
        if (journeyRoutes.isEmpty() && shouldClarifyRouteRequest(advisoryType, routeRequest, userMessage)) {
            String message = routeClarificationMessage(routeRequest);
            String sessionId = UUID.randomUUID().toString();
            sink.emit("fast_reply", streamEvent("fast_reply", message, null,
                    "FAST_REPLY", advisoryType, List.of(), List.of(), List.of(), List.of(), null, sessionId));
            ChatResponse response = new ChatResponse(
                    message,
                    "FAST_REPLY",
                    advisoryType.name(),
                    List.of(),
                    List.of(),
                    List.of(),
                    sessionId,
                    List.of(),
                    null);
            sink.emit("assistant.completed", streamEvent("assistant.completed", message, null,
                    "FAST_REPLY", advisoryType, List.of(), List.of(), List.of(), List.of(), null, sessionId));
            return response;
        }

        persist(userId, "USER", advisoryType.name(), userMessage);
        List<AiTraceEvent> traceEvents = new ArrayList<>();
        ToolTimer profileTimer = toolStarted(sink, traceEvents, "student_context", "Hồ sơ sinh viên", "Đọc trường, đăng ký tuyến và vé đang hoạt động");
        StudentContext student = knowledgeRepository.studentContext(userId);
        RegistrationSnapshot registration = knowledgeRepository.currentRegistration(student.studentCode()).orElse(null);
        TicketSnapshot activeTicket = knowledgeRepository.activeTicket(student.studentCode()).orElse(null);
        toolCompleted(sink, traceEvents, profileTimer, "Tìm thấy " + nullToBlank(student.universityName()));

        List<RouteSuggestionCard> routeSuggestions = List.of();
        if (!journeyRoutes.isEmpty()) {
            routeSuggestions = journeyRoutes;
        } else if (advisoryType == AiIntent.FARE_LOOKUP || advisoryType == AiIntent.SCHEDULE_LOOKUP) {
            routeSuggestions = routeSuggestionService.findByReference(userId,
                    intValue(request.context() == null ? null : request.context().get("routeId")), userMessage).stream().toList();
        } else if (shouldLoadRoutes(advisoryType, routeRequest, userMessage)) {
            ToolTimer routeTimer = toolStarted(sink, traceEvents, "route_suggestions", "Tuyến, trạm và lịch chạy", "Tìm tuyến phù hợp từ dữ liệu UniBus");
            routeSuggestions = routeSuggestionService.suggest(userId, routeRequest).stream().limit(3).toList();
            toolCompleted(sink, traceEvents, routeTimer, routeSuggestions.size() + " tuyến phù hợp");
        }
        List<AiSource> sources = sources(student, registration, activeTicket, routeSuggestions);
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("student", student);
        context.put("currentRegistration", registration);
        context.put("activeTicket", activeTicket);
        context.put("routeSuggestions", routeSuggestions);
        context.put("sources", sources);
        context.put("clientContext", request.context());

        boolean toolAssistedAnswer = shouldUseToolAssistedAnswer(userMessage, advisoryType, registration, activeTicket, routeSuggestions);
        String mode;
        LlmMessage llmMessage;
        AiProviderStatus providerStatus = null;
        if (toolAssistedAnswer) {
            mode = "TOOL_ASSISTED";
            llmMessage = fallbackMessage(userMessage, advisoryType, student, registration, activeTicket, routeSuggestions);
        } else {
            ToolTimer llmTimer = toolStarted(sink, traceEvents, "llm_composer", "LLM composer", "Tổng hợp câu trả lời từ context đã truy xuất");
            Optional<AiLlmService.LlmResult> llm = llmService.complete(new AiPrompt(SYSTEM_PROMPT, userMessage, context));
            providerStatus = llmService.providerStatus();
            List<RouteSuggestionCard> finalRouteSuggestions = routeSuggestions;
            if (llm.isPresent()) {
                toolCompleted(sink, traceEvents, llmTimer, "Phản hồi bởi " + llm.get().provider());
            } else {
                toolCompleted(sink, traceEvents, llmTimer, "Provider chưa sẵn sàng");
            }
            mode = llm.map(result -> result.provider().toUpperCase())
                    .orElse(providerUnavailable(providerStatus) ? "PROVIDER_UNAVAILABLE" : "FALLBACK");
            llmMessage = llm.map(result -> parseLlmMessage(result.text(), advisoryType))
                    .orElseGet(() -> fallbackMessage(userMessage, advisoryType, student, registration, activeTicket, finalRouteSuggestions));
        }
        List<AiAction> actions = routeSuggestions.stream()
                .flatMap(route -> route.actions().stream())
                .distinct()
                .limit(6)
                .toList();
        String sessionId = persist(userId, "AI", llmMessage.advisoryType().name(), llmMessage.message());
        if (providerUnavailable(providerStatus)) {
            sink.emit("provider_unavailable", streamEvent("provider_unavailable", providerStatus.message(), null,
                    mode, llmMessage.advisoryType(), routeSuggestions, actions, sources, traceEvents, providerStatus, sessionId));
        }
        emitAnswerDeltas(sink, llmMessage.message(), mode, llmMessage.advisoryType(), routeSuggestions, actions, sources, traceEvents, providerStatus, sessionId);
        if (!routeSuggestions.isEmpty()) {
            sink.emit("route.cards", streamEvent("route.cards", null, null, mode,
                    llmMessage.advisoryType(), routeSuggestions, actions, sources, traceEvents, providerStatus, sessionId));
        }
        sink.emit("assistant.completed", streamEvent("assistant.completed", llmMessage.message(), null,
                mode, llmMessage.advisoryType(), routeSuggestions, actions, sources, traceEvents, providerStatus, sessionId));
        return new ChatResponse(
                llmMessage.message(),
                mode,
                llmMessage.advisoryType().name(),
                routeSuggestions,
                actions,
                sources,
                sessionId,
                traceEvents,
                providerStatus);
    }

    private List<RouteSuggestionCard> journeyRouteSuggestions(
            Integer userId, String message, ChatRequest chatRequest, RouteEndpoints endpoints) {
        if (endpoints == null) {
            return List.of();
        }
        try {
            PlacePoint origin = resolveRoutePoint(endpoints.origin());
            PlacePoint destination = resolveRoutePoint(endpoints.destination());
            if (origin == null || destination == null) {
                return List.of();
            }
            CurrentUser currentUser = new CurrentUser(userId, "", UserRole.STUDENT, null);
            List<JourneyOption> journeys = journeyPlannerService.search(currentUser,
                    new JourneySearchRequest(origin, destination, 2, null));
            if (journeys.isEmpty()) {
                OffsetDateTime tomorrowMorning = OffsetDateTime.now(VIETNAM_ZONE)
                        .plusDays(1)
                        .withHour(7)
                        .withMinute(0)
                        .withSecond(0)
                        .withNano(0);
                journeys = journeyPlannerService.search(currentUser,
                        new JourneySearchRequest(origin, destination, 2, tomorrowMorning));
            }
            if (journeys.isEmpty()) {
                return List.of();
            }
            Map<Integer, RouteSuggestionCard> cards = routeSuggestionService.suggest(userId,
                    new RouteSuggestionRequest(null, null, null, preferences(chatRequest), message, null))
                    .stream()
                    .collect(java.util.stream.Collectors.toMap(
                            RouteSuggestionCard::routeId,
                            card -> card,
                            (left, right) -> left,
                            LinkedHashMap::new));
            return journeys.getFirst().legs().stream()
                    .filter(leg -> "BUS".equalsIgnoreCase(leg.mode()) && leg.routeId() != null)
                    .map(leg -> cards.get(leg.routeId()))
                    .filter(java.util.Objects::nonNull)
                    .distinct()
                    .toList();
        } catch (RuntimeException exception) {
            log.debug("Unable to resolve chatbot journey route", exception);
        }
        return List.of();
    }

    private RouteEndpoints routeEndpoints(String message) {
        String text = message == null ? "" : message.trim();
        for (Pattern connector : ROUTE_CONNECTORS) {
            Matcher matcher = connector.matcher(text);
            if (!matcher.find()) continue;
            String origin = expandUniversityAbbreviation(
                    ORIGIN_PREFIX.matcher(text.substring(0, matcher.start())).replaceFirst("").trim());
            String destination = expandUniversityAbbreviation(
                    DESTINATION_SUFFIX.matcher(text.substring(matcher.end())).replaceFirst("").trim());
            if (!origin.isBlank() && !destination.isBlank()) {
                return new RouteEndpoints(origin, destination);
            }
        }
        return null;
    }

    private boolean needsCampusClarification(RouteEndpoints endpoints) {
        String destination = normalizeSearchText(endpoints.destination());
        // ponytail: one ambiguous campus today; replace with campus catalog aliases when that data exists.
        return destination.equals("duy tan") || destination.equals("dai hoc duy tan")
                || destination.matches("^(?:dai hoc )?duy tan (?:di xe|di sao).*$");
    }

    private ChatResponse quickResponse(StreamSink sink, AiIntent type, String message) {
        String sessionId = UUID.randomUUID().toString();
        ChatResponse response = new ChatResponse(message, "FAST_REPLY", type.name(), List.of(), List.of(), List.of(),
                sessionId, List.of(), null);
        sink.emit("fast_reply", streamEvent("fast_reply", message, null,
                "FAST_REPLY", type, List.of(), List.of(), List.of(), List.of(), null, sessionId));
        sink.emit("assistant.completed", streamEvent("assistant.completed", message, null,
                "FAST_REPLY", type, List.of(), List.of(), List.of(), List.of(), null, sessionId));
        return response;
    }

    private String expandUniversityAbbreviation(String value) {
        return value.replaceAll("(?iu)(^|\\s)(?:đh|dh)(?=\\s)", "$1Đại học");
    }

    private PlacePoint placePoint(PlaceSuggestion place) {
        return place.stopId() == null
                ? new PlacePoint(place.id(), null, place.label(), place.latitude(), place.longitude())
                : new PlacePoint(null, place.stopId(), place.label(), null, null);
    }

    private PlacePoint resolveRoutePoint(String query) {
        String normalized = normalizeSearchText(query);
        // ponytail: demo campus aliases avoid external geocoder latency; move coordinates to a campus catalog when one exists.
        if (normalized.contains("fpt") && normalized.contains("da nang")) {
            return new PlacePoint("campus:fpt-danang", null, "Trường Đại học FPT Đà Nẵng",
                    BigDecimal.valueOf(15.9674834), BigDecimal.valueOf(108.2603613));
        }
        if (normalized.contains("duy tan") && normalized.contains("nguyen van linh")) {
            return new PlacePoint("campus:dtu-nguyen-van-linh", null, "Đại học Duy Tân 254 Nguyễn Văn Linh",
                    BigDecimal.valueOf(16.0600568), BigDecimal.valueOf(108.2096704));
        }
        return placeService.search(query, null, null, 1).stream()
                .filter(this::isUsablePlace)
                .findFirst()
                .map(this::placePoint)
                .orElse(null);
    }

    private boolean isUsablePlace(PlaceSuggestion place) {
        return place.stopId() != null || (place.latitude() != null && place.longitude() != null);
    }

    private List<String> preferences(ChatRequest request) {
        Object value = request.context() == null ? null : request.context().get("preferences");
        return value instanceof List<?> list ? list.stream().map(String::valueOf).toList() : List.of();
    }

    private boolean hasStopPair(Map<String, Object> context) {
        return context != null && intValue(context.get("boardingStopId")) != null
                && intValue(context.get("alightingStopId")) != null;
    }

    private record RouteEndpoints(String origin, String destination) {
    }

    private boolean shouldUseToolAssistedAnswer(
            String message,
            AiIntent advisoryType,
            RegistrationSnapshot registration,
            TicketSnapshot activeTicket,
            List<RouteSuggestionCard> routes) {
        String text = normalizeSearchText(message);
        if (text.length() > 180) {
            return false;
        }
        boolean needsReasoning = containsAny(text, "so sanh", "phan tich", "tai sao", "giai thich", "toi uu", "ke hoach");
        if (needsReasoning) {
            return false;
        }
        return switch (advisoryType) {
            case PAYMENT_LOOKUP, VERIFICATION -> true;
            case FARE_LOOKUP, SCHEDULE_LOOKUP -> !routes.isEmpty() || registration != null || activeTicket != null;
            case ROUTE_SUGGESTION -> !routes.isEmpty();
            case HELP -> registration != null || activeTicket != null;
            default -> false;
        };
    }

    private boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) {
                return true;
            }
        }
        return false;
    }

    private boolean shouldClarifyRouteRequest(AiIntent advisoryType, RouteSuggestionRequest request, String message) {
        if (advisoryType != AiIntent.ROUTE_SUGGESTION) {
            return false;
        }
        if (request != null && request.boardingStopId() != null && request.alightingStopId() != null) {
            return false;
        }
        String text = normalizeSearchText(message);
        if (containsAny(text, "so sanh", "phan tich", "giai thich", "toi uu", "tai sao")) {
            return false;
        }
        boolean routePrompt = containsAny(text, "tuyen", "tuyen xe", "xe bus", "bus", "duong di", "goi y");
        return routePrompt && text.length() <= 60;
    }

    private String routeClarificationMessage(RouteSuggestionRequest request) {
        if (request != null && request.boardingStopId() != null) {
            return "Bạn muốn xuống ở đâu? Hãy nhập thêm điểm đến, ví dụ: từ Đại học Bách khoa Đà Nẵng đến Đại học FPT.";
        }
        if (request != null && request.alightingStopId() != null) {
            return "Bạn muốn xuất phát từ đâu? Hãy nhập đủ điểm đi và điểm đến, ví dụ: từ Đại học Bách khoa Đà Nẵng đến Đại học FPT.";
        }
        return "Bạn muốn tìm tuyến từ đâu đến đâu? Hãy nhập kiểu: từ Đại học Bách khoa Đà Nẵng đến Đại học FPT.";
    }

    private RouteSuggestionRequest routeRequestFromChat(Integer userId, ChatRequest request, AiIntent advisoryType) {
        Map<String, Object> context = request.context();
        Integer boardingStopId = intValue(context == null ? null : context.get("boardingStopId"));
        Integer alightingStopId = intValue(context == null ? null : context.get("alightingStopId"));
        String preferredDepartureTime = stringValue(context == null ? null : context.get("preferredDepartureTime"));
        @SuppressWarnings("unchecked")
        List<String> preferences = context != null && context.get("preferences") instanceof List<?>
                ? ((List<?>) context.get("preferences")).stream().map(String::valueOf).toList()
                : List.of();
        if (boardingStopId == null || alightingStopId == null) {
            List<StopMention> mentions = stopMentions(request.message());
            StopPair matchedPair = boardingStopId == null && alightingStopId == null
                    ? firstRouteCompatiblePair(mentions)
                    : null;
            if (matchedPair != null) {
                boardingStopId = matchedPair.boardingStopId();
                alightingStopId = matchedPair.alightingStopId();
            }
            if (!mentions.isEmpty()) {
                StopMention firstMention = mentions.get(0);
                StopMention secondMention = mentions.size() > 1 ? mentions.get(1) : null;
                if (matchedPair == null) {
                    if (boardingStopId == null && shouldTreatSingleMentionAsDestination(request.message(), firstMention)) {
                        alightingStopId = alightingStopId == null ? firstMention.stopId() : alightingStopId;
                    } else if (boardingStopId == null) {
                        boardingStopId = firstMention.stopId();
                    }
                    if (alightingStopId == null && secondMention != null) {
                        alightingStopId = secondMention.stopId();
                    }
                }
            }
        }
        return new RouteSuggestionRequest(
                boardingStopId,
                alightingStopId,
                preferredDepartureTime,
                preferences,
                request.message(),
                advisoryType == AiIntent.FARE_LOOKUP ? "cheap" : null);
    }

    private StopPair firstRouteCompatiblePair(List<StopMention> mentions) {
        if (mentions.size() < 2) {
            return null;
        }
        List<StopMention> limitedMentions = mentions.stream().limit(12).toList();
        String values = String.join(", ", java.util.Collections.nCopies(limitedMentions.size(), "(?, ?, ?)"));
        List<Object> parameters = new ArrayList<>();
        for (int rank = 0; rank < limitedMentions.size(); rank++) {
            StopMention mention = limitedMentions.get(rank);
            parameters.add(mention.stopId());
            parameters.add(rank);
            parameters.add(mention.index());
        }
        return jdbcTemplate.query("""
                WITH mentioned(stop_id, mention_rank, mention_index) AS (VALUES %s)
                SELECT origin.stop_id AS boarding_stop_id, destination.stop_id AS alighting_stop_id
                FROM mentioned origin_mention
                JOIN mentioned destination_mention
                  ON destination_mention.mention_rank > origin_mention.mention_rank
                 AND destination_mention.mention_index <> origin_mention.mention_index
                JOIN route_stops origin ON origin.stop_id = origin_mention.stop_id
                JOIN route_stops destination ON destination.route_id = origin.route_id
                 AND destination.stop_id = destination_mention.stop_id
                 AND destination.stop_order > origin.stop_order
                JOIN routes route ON route.route_id = origin.route_id AND route.status = 'ACTIVE'
                ORDER BY origin_mention.mention_rank, destination_mention.mention_rank
                LIMIT 1
                """.formatted(values), (rs, rowNum) -> new StopPair(
                        rs.getInt("boarding_stop_id"), rs.getInt("alighting_stop_id")), parameters.toArray())
                .stream().findFirst().orElse(null);
    }

    private List<StopMention> stopMentions(String message) {
        String normalizedMessage = normalizeSearchText(message);
        if (normalizedMessage.isBlank()) {
            return List.of();
        }
        List<StopMention> mentions = jdbcTemplate.query("""
                SELECT stop_id, stop_code, stop_name
                FROM stops
                WHERE status = 'ACTIVE'
                """, (rs, rowNum) -> {
            Integer stopId = rs.getInt("stop_id");
            String stopCode = rs.getString("stop_code");
            String stopName = rs.getString("stop_name");
            int index = stopMentionIndex(normalizedMessage, stopCode, stopName);
            return index < 0 ? null : new StopMention(stopId, stopName, index);
        }).stream()
                .filter(mention -> mention != null)
                .sorted(Comparator.comparingInt(StopMention::index))
                .toList();
        List<StopMention> unique = new ArrayList<>();
        for (StopMention mention : mentions) {
            if (unique.stream().noneMatch(existing -> existing.stopId().equals(mention.stopId()))) {
                unique.add(mention);
            }
        }
        return unique;
    }

    private int stopMentionIndex(String normalizedMessage, String stopCode, String stopName) {
        int best = -1;
        for (String alias : stopAliases(stopCode, stopName)) {
            int index = normalizedMessage.indexOf(alias);
            if (index >= 0 && (best < 0 || index < best)) {
                best = index;
            }
        }
        return best;
    }

    private List<String> stopAliases(String stopCode, String stopName) {
        List<String> aliases = new ArrayList<>();
        String name = normalizeSearchText(stopName);
        String code = normalizeSearchText(stopCode);
        addAlias(aliases, name);
        addAlias(aliases, code);
        addAlias(aliases, name.replace("dai hoc ", "").replace(" da nang", "").trim());
        addCampusAlias(aliases, name, "bach khoa");
        addCampusAlias(aliases, name, "fpt");
        addCampusAlias(aliases, name, "vku");
        addCampusAlias(aliases, name, "viet han");
        addCampusAlias(aliases, name, "kinh te");
        addCampusAlias(aliases, name, "duy tan");
        addCampusAlias(aliases, name, "su pham");
        addCampusAlias(aliases, name, "ben xe");
        addCampusAlias(aliases, name, "cho han");
        addCampusAlias(aliases, name, "cau rong");
        return aliases;
    }

    private void addCampusAlias(List<String> aliases, String name, String alias) {
        if (name.contains(alias)) {
            addAlias(aliases, alias);
        }
    }

    private void addAlias(List<String> aliases, String alias) {
        if (alias != null && alias.length() >= 3 && !aliases.contains(alias)) {
            aliases.add(alias);
        }
    }

    private boolean shouldTreatSingleMentionAsDestination(String message, StopMention mention) {
        String normalizedMessage = normalizeSearchText(message);
        int destinationWord = (" " + normalizedMessage + " ").indexOf(" den ");
        return destinationWord >= 0 && destinationWord < mention.index();
    }

    private String normalizeSearchText(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String lower = value.toLowerCase(Locale.ROOT).replace('đ', 'd');
        String withoutAccent = Normalizer.normalize(lower, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return withoutAccent.replaceAll("[^a-z0-9]+", " ").trim();
    }

    private boolean shouldLoadRoutes(AiIntent advisoryType, RouteSuggestionRequest request, String userMessage) {
        boolean hasStopPair = request != null
                && request.boardingStopId() != null
                && request.alightingStopId() != null;
        if (advisoryType == AiIntent.ROUTE_SUGGESTION) {
            return hasStopPair;
        }
        if (advisoryType == AiIntent.FARE_LOOKUP || advisoryType == AiIntent.SCHEDULE_LOOKUP) {
            return hasStopPair;
        }
        if (advisoryType == AiIntent.HELP) {
            return hasStopPair && normalizeSearchText(userMessage).contains("tuyen");
        }
        return false;
    }

    private LlmMessage parseLlmMessage(String text, AiIntent fallbackType) {
        String candidate = stripCodeFence(text);
        try {
            JsonNode root = objectMapper.readTree(candidate);
            String message = root.path("message").asText("");
            AiIntent type = parseType(root.path("advisoryType").asText(""), fallbackType);
            if (!message.isBlank()) {
                return new LlmMessage(message, type);
            }
        } catch (RuntimeException ignored) {
            // Some models may return text despite the JSON instruction; still use it.
        } catch (Exception ignored) {
        }
        return new LlmMessage(text, fallbackType);
    }

    private String stripCodeFence(String text) {
        String trimmed = text == null ? "" : text.trim();
        if (trimmed.startsWith("```")) {
            int firstLine = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstLine >= 0 && lastFence > firstLine) {
                return trimmed.substring(firstLine + 1, lastFence).trim();
            }
        }
        return trimmed;
    }

    private AiIntent parseType(String value, AiIntent fallback) {
        try {
            return AiIntent.valueOf(value);
        } catch (RuntimeException exception) {
            return fallback;
        }
    }

    private LlmMessage fallbackMessage(
            String userMessage,
            AiIntent advisoryType,
            StudentContext student,
            RegistrationSnapshot registration,
            TicketSnapshot activeTicket,
            List<RouteSuggestionCard> routes) {
        if (advisoryType == AiIntent.ROUTE_SUGGESTION && routes.isEmpty()) {
            return new LlmMessage("Mình chưa tìm thấy tuyến phù hợp từ dữ liệu hiện tại. Bạn hãy chọn rõ trạm lên và trạm xuống để mình lọc chính xác hơn.", advisoryType);
        }
        if (advisoryType == AiIntent.ROUTE_SUGGESTION) {
            RouteSuggestionCard top = routes.get(0);
            String departures = top.nextDepartures().isEmpty() ? "chưa có lịch gần nhất" : String.join(", ", top.nextDepartures());
            return new LlmMessage("Tuyến %s phù hợp nhất. Vé lượt %s · Vé tháng %s. Chuyến kế tiếp: %s."
                    .formatted(
                            nullToBlank(top.routeCode()),
                            money(top.singleFare()),
                            money(top.finalFare()),
                            departures), advisoryType);
        }
        if (advisoryType == AiIntent.FARE_LOOKUP && !routes.isEmpty()) {
            RouteSuggestionCard route = routes.getFirst();
            return new LlmMessage("Tuyến %s: Vé lượt %s. Vé tháng %s. Trường hỗ trợ %s, Sinh viên trả %s."
                    .formatted(nullToBlank(route.routeCode()), money(route.singleFare()), money(route.monthlyFare()),
                            money(route.subsidyAmount()), money(route.finalFare())), advisoryType);
        }
        if (advisoryType == AiIntent.SCHEDULE_LOOKUP && !routes.isEmpty()) {
            RouteSuggestionCard route = routes.getFirst();
            String departures = route.nextDepartures().isEmpty()
                    ? "chưa có lịch hoạt động"
                    : String.join(", ", route.nextDepartures());
            return new LlmMessage("Tuyến %s · Lịch gần nhất: %s."
                    .formatted(nullToBlank(route.routeCode()), departures), advisoryType);
        }
        if (advisoryType == AiIntent.PAYMENT_LOOKUP) {
            String normalized = normalizeSearchText(userMessage);
            if (containsAny(normalized, "lam the nao", "cach mua", "huong dan")) {
                return new LlmMessage("Vào Thanh toán, chọn Vé lượt hoặc Vé tháng, chọn tuyến rồi quét QR SePay.", advisoryType);
            }
            return new LlmMessage(activeTicket == null
                    ? "Bạn chưa có vé đang sử dụng. Vào Thanh toán để chọn loại vé và tạo QR SePay."
                    : "Bạn đang có vé %s cho tuyến %s, trạng thái %s."
                            .formatted(ticketTypeLabel(activeTicket.ticketType()), activeTicket.routeName(),
                                    ticketStatusLabel(activeTicket.status())), advisoryType);
        }
        if (advisoryType == AiIntent.VERIFICATION) {
            return new LlmMessage("Bạn %s sinh viên tại %s."
                    .formatted(verificationLabel(student.verificationStatus()), nullToBlank(student.universityName())), advisoryType);
        }
        if (advisoryType == AiIntent.HELP) {
            return new LlmMessage("Cho mình điểm xuất phát và nơi bạn muốn đến.", advisoryType);
        }
        if (registration != null) {
            return new LlmMessage("Mình có thể hỗ trợ bạn tra tuyến, giá vé, lịch chạy và vé. Hiện bạn đang đăng ký tuyến %s - %s."
                    .formatted(nullToBlank(registration.routeCode()), registration.routeName()), advisoryType);
        }
        return new LlmMessage("Mình có thể giúp bạn gợi ý tuyến, tra giá vé, lịch xe, ETA và hướng dẫn mua vé SePay. Bạn hãy cho mình biết trạm lên, trạm xuống hoặc nơi bạn muốn đến nhé.", advisoryType);
    }

    private String ticketTypeLabel(String value) {
        return "MONTHLY".equalsIgnoreCase(value) ? "Vé tháng"
                : "SINGLE".equalsIgnoreCase(value) ? "Vé lượt" : nullToBlank(value);
    }

    private String money(BigDecimal value) {
        if (value == null) {
            return "chưa có dữ liệu";
        }
        return String.format(Locale.forLanguageTag("vi-VN"), "%,.0f đ", value);
    }

    private String ticketStatusLabel(String value) {
        return "ACTIVE".equalsIgnoreCase(value) ? "Đang sử dụng"
                : "UNUSED".equalsIgnoreCase(value) ? "Chưa sử dụng" : nullToBlank(value);
    }

    private String verificationLabel(String value) {
        return "VERIFIED".equalsIgnoreCase(value) ? "đã được xác minh"
                : "PENDING".equalsIgnoreCase(value) ? "đang chờ xác minh" : "chưa được xác minh";
    }

    private List<AiSource> sources(
            StudentContext student,
            RegistrationSnapshot registration,
            TicketSnapshot activeTicket,
            List<RouteSuggestionCard> routeSuggestions) {
        List<AiSource> sources = new java.util.ArrayList<>();
        sources.add(new AiSource("STUDENT_PROFILE", "Hồ sơ sinh viên", nullToBlank(student.universityName())));
        if (registration != null) {
            sources.add(new AiSource("REGISTRATION", "Đăng ký tuyến hiện tại", registration.routeName()));
        }
        if (activeTicket != null) {
            sources.add(new AiSource("TICKET", "Vé đang hoạt động", activeTicket.routeName()));
        }
        if (!routeSuggestions.isEmpty()) {
            sources.add(new AiSource("ROUTE_SUGGESTIONS", "Tuyến gợi ý", routeSuggestions.size() + " tuyến"));
        }
        return sources;
    }

    private String persist(Integer userId, String role, String advisoryType, String content) {
        String fallbackSessionId = UUID.randomUUID().toString();
        try {
            String sessionId = jdbcTemplate.query("""
                    SELECT chat_session_id FROM ai_chat_history
                    WHERE user_id = ?
                    ORDER BY sent_at DESC, chat_history_id DESC LIMIT 1
                    """, (rs, rowNum) -> rs.getString("chat_session_id"), userId).stream()
                    .findFirst()
                    .orElse(fallbackSessionId);
            jdbcTemplate.update("""
                    INSERT INTO ai_chat_history (user_id, chat_session_id, message_role, content, advisory_type, sent_at)
                    VALUES (?, CAST(? AS UUID), ?, ?, ?, CURRENT_TIMESTAMP)
                    """, userId, sessionId, role, content, storableAdvisoryType(advisoryType));
            return sessionId;
        } catch (DataAccessException exception) {
            log.warn("Unable to persist AI chat history; continuing response without history: {}",
                    exception.getMostSpecificCause().getMessage());
            return fallbackSessionId;
        }
    }

    private String storableAdvisoryType(String advisoryType) {
        return switch (advisoryType) {
            case "ROUTE_SUGGESTION", "FARE_LOOKUP", "SCHEDULE_LOOKUP", "OTHER" -> advisoryType;
            default -> "OTHER";
        };
    }

    private Integer intValue(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String text && !text.isBlank()) {
            try {
                return Integer.parseInt(text);
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String nullToBlank(String value) {
        return value == null ? "" : value;
    }

    private ToolTimer toolStarted(
            StreamSink sink,
            List<AiTraceEvent> traceEvents,
            String tool,
            String label,
            String detail) {
        ToolTimer timer = new ToolTimer(tool, label, detail, System.currentTimeMillis());
        AiTraceEvent event = new AiTraceEvent("tool.started", tool, label, detail, "RUNNING", 0L);
        traceEvents.add(event);
        sink.emit("tool.started", streamEvent("tool.started", null, null, null,
                null, List.of(), List.of(), List.of(), List.of(event), null, null));
        return timer;
    }

    private void toolCompleted(
            StreamSink sink,
            List<AiTraceEvent> traceEvents,
            ToolTimer timer,
            String detail) {
        long elapsedMs = Math.max(0L, System.currentTimeMillis() - timer.startedAtMs());
        AiTraceEvent event = new AiTraceEvent(
                "tool.completed",
                timer.tool(),
                timer.label(),
                detail == null || detail.isBlank() ? timer.detail() : detail,
                "COMPLETED",
                elapsedMs);
        traceEvents.add(event);
        sink.emit("tool.completed", streamEvent("tool.completed", null, null, null,
                null, List.of(), List.of(), List.of(), List.of(event), null, null));
    }

    private void emitAnswerDeltas(
            StreamSink sink,
            String message,
            String mode,
            AiIntent advisoryType,
            List<RouteSuggestionCard> routeSuggestions,
            List<AiAction> actions,
            List<AiSource> sources,
            List<AiTraceEvent> traceEvents,
            AiProviderStatus providerStatus,
            String sessionId) {
        for (String delta : chunks(message)) {
            sink.emit("answer.delta", streamEvent("answer.delta", null, delta, mode,
                    advisoryType, routeSuggestions, actions, sources, traceEvents, providerStatus, sessionId));
        }
    }

    private List<String> chunks(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        List<String> chunks = new ArrayList<>();
        String[] words = value.split(" ");
        StringBuilder current = new StringBuilder();
        for (String word : words) {
            if (current.length() + word.length() > 34 && current.length() > 0) {
                chunks.add(current.toString());
                current.setLength(0);
            }
            if (current.length() > 0) {
                current.append(' ');
            }
            current.append(word);
        }
        if (current.length() > 0) {
            chunks.add(current.toString());
        }
        return chunks;
    }

    private ChatStreamEvent streamEvent(
            String type,
            String message,
            String delta,
            String mode,
            AiIntent advisoryType,
            List<RouteSuggestionCard> routeSuggestions,
            List<AiAction> actions,
            List<AiSource> sources,
            List<AiTraceEvent> traceEvents,
            AiProviderStatus providerStatus,
            String sessionId) {
        return new ChatStreamEvent(
                type,
                message,
                delta,
                mode,
                advisoryType == null ? null : advisoryType.name(),
                routeSuggestions,
                actions,
                sources,
                traceEvents,
                providerStatus,
                sessionId);
    }

    private boolean providerUnavailable(AiProviderStatus providerStatus) {
        if (providerStatus == null || providerStatus.status() == null) {
            return false;
        }
        return switch (providerStatus.status()) {
            case "UNAVAILABLE", "CIRCUIT_OPEN" -> true;
            default -> false;
        };
    }

    public interface StreamSink {
        void emit(String eventName, ChatStreamEvent event);

        static StreamSink noop() {
            return (eventName, event) -> {
            };
        }
    }

    private record ToolTimer(String tool, String label, String detail, long startedAtMs) {
    }

    private record LlmMessage(String message, AiIntent advisoryType) {
    }

    private record StopMention(Integer stopId, String stopName, int index) {
    }

    private record StopPair(Integer boardingStopId, Integer alightingStopId) {
    }
}
