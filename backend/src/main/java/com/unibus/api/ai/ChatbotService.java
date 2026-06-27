package com.unibus.api.ai;

import java.time.OffsetDateTime;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unibus.api.ai.AiDtos.AiAction;
import com.unibus.api.ai.AiDtos.AiSource;
import com.unibus.api.ai.AiDtos.ChatRequest;
import com.unibus.api.ai.AiDtos.ChatResponse;
import com.unibus.api.ai.AiDtos.RouteSuggestionCard;
import com.unibus.api.ai.AiDtos.RouteSuggestionRequest;
import com.unibus.api.ai.AiKnowledgeRepository.RegistrationSnapshot;
import com.unibus.api.ai.AiKnowledgeRepository.StudentContext;
import com.unibus.api.ai.AiKnowledgeRepository.TicketSnapshot;
import com.unibus.api.ai.AiLlmService.AiPrompt;

@Service
public class ChatbotService {

    private static final Logger log = LoggerFactory.getLogger(ChatbotService.class);

    private static final String SYSTEM_PROMPT = """
            Bạn là UniBus AI Copilot cho sinh viên.
            Chỉ trả lời dựa trên UniBus context JSON được backend cung cấp.
            Không bịa tuyến, trạm, lịch chạy, giá vé, trạng thái thanh toán hoặc chính sách trợ giá.
            Nếu context thiếu dữ liệu quan trọng, hãy hỏi lại ngắn gọn.
            Không sinh SQL, không yêu cầu quyền admin, không tự thực hiện đăng ký tuyến hoặc mua vé.
            Trả về JSON thuần, không markdown, theo schema:
            {"message":"câu trả lời tiếng Việt","advisoryType":"ROUTE_SUGGESTION|FARE_LOOKUP|SCHEDULE_LOOKUP|PAYMENT_LOOKUP|VERIFICATION|HELP|OTHER"}
            """;

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final AiKnowledgeRepository knowledgeRepository;
    private final RouteSuggestionService routeSuggestionService;
    private final AiLlmService llmService;

    public ChatbotService(
            JdbcTemplate jdbcTemplate,
            AiKnowledgeRepository knowledgeRepository,
            RouteSuggestionService routeSuggestionService,
            AiLlmService llmService) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = new ObjectMapper();
        this.knowledgeRepository = knowledgeRepository;
        this.routeSuggestionService = routeSuggestionService;
        this.llmService = llmService;
    }

    @Transactional
    public ChatResponse respond(Integer userId, ChatRequest request) {
        String userMessage = request.message() == null ? "" : request.message().trim();
        AdvisoryType advisoryType = detectIntent(userMessage);
        StudentContext student = knowledgeRepository.studentContext(userId);
        RegistrationSnapshot registration = knowledgeRepository.currentRegistration(student.studentCode()).orElse(null);
        TicketSnapshot activeTicket = knowledgeRepository.activeTicket(student.studentCode()).orElse(null);
        RouteSuggestionRequest routeRequest = routeRequestFromChat(userId, request, advisoryType);
        List<RouteSuggestionCard> routeSuggestions = shouldLoadRoutes(advisoryType)
                ? routeSuggestionService.suggest(userId, routeRequest).stream().limit(3).toList()
                : List.of();
        List<AiSource> sources = sources(student, registration, activeTicket, routeSuggestions);
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("student", student);
        context.put("currentRegistration", registration);
        context.put("activeTicket", activeTicket);
        context.put("routeSuggestions", routeSuggestions);
        context.put("sources", sources);
        context.put("clientContext", request.context());

        persist(userId, "USER", advisoryType.name(), userMessage);
        Optional<AiLlmService.LlmResult> llm = llmService.complete(new AiPrompt(SYSTEM_PROMPT, userMessage, context));
        String mode = llm.map(result -> result.provider().toUpperCase()).orElse("FALLBACK");
        LlmMessage llmMessage = llm.map(result -> parseLlmMessage(result.text(), advisoryType))
                .orElseGet(() -> fallbackMessage(userMessage, advisoryType, student, registration, activeTicket, routeSuggestions));
        List<AiAction> actions = routeSuggestions.stream()
                .flatMap(route -> route.actions().stream())
                .distinct()
                .limit(6)
                .toList();
        String sessionId = persist(userId, "AI", llmMessage.advisoryType().name(), llmMessage.message());
        return new ChatResponse(
                llmMessage.message(),
                mode,
                llmMessage.advisoryType().name(),
                routeSuggestions,
                actions,
                sources,
                sessionId);
    }

    private RouteSuggestionRequest routeRequestFromChat(Integer userId, ChatRequest request, AdvisoryType advisoryType) {
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
                    ? firstRouteCompatiblePair(userId, mentions, preferredDepartureTime, preferences, request.message())
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
                advisoryType == AdvisoryType.FARE_LOOKUP ? "cheap" : null);
    }

    private StopPair firstRouteCompatiblePair(
            Integer userId,
            List<StopMention> mentions,
            String preferredDepartureTime,
            List<String> preferences,
            String message) {
        if (mentions.size() < 2) {
            return null;
        }
        List<StopMention> limitedMentions = mentions.stream().limit(12).toList();
        for (int originIndex = 0; originIndex < limitedMentions.size(); originIndex++) {
            StopMention origin = limitedMentions.get(originIndex);
            for (int destinationIndex = originIndex + 1; destinationIndex < limitedMentions.size(); destinationIndex++) {
                StopMention destination = limitedMentions.get(destinationIndex);
                if (origin.stopId().equals(destination.stopId())) {
                    continue;
                }
                RouteSuggestionRequest request = new RouteSuggestionRequest(
                        origin.stopId(),
                        destination.stopId(),
                        preferredDepartureTime,
                        preferences,
                        message,
                        null);
                if (!routeSuggestionService.suggest(userId, request).isEmpty()) {
                    return new StopPair(origin.stopId(), destination.stopId());
                }
            }
        }
        return null;
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

    private boolean shouldLoadRoutes(AdvisoryType advisoryType) {
        return advisoryType == AdvisoryType.ROUTE_SUGGESTION
                || advisoryType == AdvisoryType.FARE_LOOKUP
                || advisoryType == AdvisoryType.SCHEDULE_LOOKUP
                || advisoryType == AdvisoryType.HELP;
    }

    private AdvisoryType detectIntent(String message) {
        String text = message.toLowerCase();
        if (text.contains("tuyến") || text.contains("đường") || text.contains("đi tới")
                || text.contains("đi đến") || text.contains("gợi ý") || text.contains("nhanh")
                || text.contains("rẻ") || (text.contains("đi từ") && text.contains("đến"))) {
            return AdvisoryType.ROUTE_SUGGESTION;
        }
        if (text.contains("giá") || text.contains("bao nhiêu tiền") || text.contains("vé tháng")
                || text.contains("vé lẻ")) {
            return AdvisoryType.FARE_LOOKUP;
        }
        if (text.contains("lịch") || text.contains("mấy giờ") || text.contains("eta")
                || text.contains("chuyến")) {
            return AdvisoryType.SCHEDULE_LOOKUP;
        }
        if (text.contains("thanh toán") || text.contains("sepay") || text.contains("qr")
                || text.contains("mua vé")) {
            return AdvisoryType.PAYMENT_LOOKUP;
        }
        if (text.contains("xác minh") || text.contains("trường của tôi") || text.contains("mssv")) {
            return AdvisoryType.VERIFICATION;
        }
        if (text.contains("giúp") || text.contains("help") || text.contains("chào")) {
            return AdvisoryType.HELP;
        }
        return AdvisoryType.OTHER;
    }

    private LlmMessage parseLlmMessage(String text, AdvisoryType fallbackType) {
        String candidate = stripCodeFence(text);
        try {
            JsonNode root = objectMapper.readTree(candidate);
            String message = root.path("message").asText("");
            AdvisoryType type = parseType(root.path("advisoryType").asText(""), fallbackType);
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

    private AdvisoryType parseType(String value, AdvisoryType fallback) {
        try {
            return AdvisoryType.valueOf(value);
        } catch (RuntimeException exception) {
            return fallback;
        }
    }

    private LlmMessage fallbackMessage(
            String userMessage,
            AdvisoryType advisoryType,
            StudentContext student,
            RegistrationSnapshot registration,
            TicketSnapshot activeTicket,
            List<RouteSuggestionCard> routes) {
        if (advisoryType == AdvisoryType.ROUTE_SUGGESTION && routes.isEmpty()) {
            return new LlmMessage("Mình chưa tìm thấy tuyến phù hợp từ dữ liệu hiện tại. Bạn hãy chọn rõ trạm lên và trạm xuống để mình lọc chính xác hơn.", advisoryType);
        }
        if (advisoryType == AdvisoryType.ROUTE_SUGGESTION) {
            RouteSuggestionCard top = routes.get(0);
            String departures = top.nextDepartures().isEmpty() ? "chưa có lịch gần nhất" : String.join(", ", top.nextDepartures());
            return new LlmMessage("Mình gợi ý tuyến %s - %s. Lý do: %s. Vé tháng sau trợ giá khoảng %s VND, chuyến gần nhất: %s."
                    .formatted(
                            nullToBlank(top.routeCode()),
                            top.routeName(),
                            String.join(", ", top.reasons()),
                            top.finalFare() == null ? "chưa có dữ liệu" : top.finalFare().toPlainString(),
                            departures), advisoryType);
        }
        if (advisoryType == AdvisoryType.PAYMENT_LOOKUP) {
            return new LlmMessage(activeTicket == null
                    ? "Bạn chưa có vé tháng đang hoạt động. Hãy đăng ký tuyến trước, sau đó vào mục Mua vé tháng để tạo QR SePay."
                    : "Bạn đang có vé %s cho tuyến %s, trạng thái %s."
                            .formatted(activeTicket.ticketType(), activeTicket.routeName(), activeTicket.status()), advisoryType);
        }
        if (advisoryType == AdvisoryType.VERIFICATION) {
            return new LlmMessage("Trạng thái xác minh sinh viên của bạn hiện là %s, trường liên kết: %s."
                    .formatted(nullToBlank(student.verificationStatus()), nullToBlank(student.universityName())), advisoryType);
        }
        if (registration != null) {
            return new LlmMessage("Mình có thể hỗ trợ bạn tra tuyến, giá vé, lịch chạy và vé. Hiện bạn đang đăng ký tuyến %s - %s."
                    .formatted(nullToBlank(registration.routeCode()), registration.routeName()), advisoryType);
        }
        return new LlmMessage("Mình có thể giúp bạn gợi ý tuyến, tra giá vé, lịch xe, ETA và hướng dẫn mua vé SePay. Bạn hãy cho mình biết trạm lên, trạm xuống hoặc nơi bạn muốn đến nhé.", advisoryType);
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

    private enum AdvisoryType {
        ROUTE_SUGGESTION, FARE_LOOKUP, SCHEDULE_LOOKUP, PAYMENT_LOOKUP, VERIFICATION, HELP, OTHER
    }

    private record LlmMessage(String message, AdvisoryType advisoryType) {
    }

    private record StopMention(Integer stopId, String stopName, int index) {
    }

    private record StopPair(Integer boardingStopId, Integer alightingStopId) {
    }
}
