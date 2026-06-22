package com.unibus.api.ai;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Rule-based chatbot service for REQ-STU-017.
 *
 * <p>Implements intent detection on Vietnamese natural-language queries:
 * <ul>
 *   <li><b>FARE_LOOKUP</b> - "giá vé", "bao nhiêu tiền", "giá" - looks up SINGLE/MONTHLY fare</li>
 *   <li><b>SCHEDULE_LOOKUP</b> - "lịch", "giờ chạy", "mấy giờ", "chuyến" - looks up first/last trip + frequency</li>
 *   <li><b>ROUTE_SUGGESTION</b> - "tuyến nào", "đường nào", "đi bằng" - returns top 3 routes</li>
 *   <li><b>OTHER</b> - fallback - returns a helpful default message</li>
 * </ul>
 *
 * <p>Each turn is persisted to {@code ai_chat_history} with {@code message_role=USER/AI} and
 * {@code advisory_type} set to the detected intent. The frontend can replay the history
 * via {@code GET /api/v1/students/me/assistant-chat}.
 *
 * <p>For a real conversational chatbot, replace {@link #respond} with a call to an LLM
 * (Gemini, OpenAI, Anthropic, etc.) that has access to the same DB lookups as tool calls.
 */
@Service
public class ChatbotService {

    private final JdbcTemplate jdbcTemplate;
    private final RouteSuggestionService routeSuggestionService;

    public ChatbotService(JdbcTemplate jdbcTemplate, RouteSuggestionService routeSuggestionService) {
        this.jdbcTemplate = jdbcTemplate;
        this.routeSuggestionService = routeSuggestionService;
    }

    public ChatTurn respond(Integer userId, String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return persistTurn(userId, "USER", "OTHER", userMessage,
                    "Xin lỗi, mình không hiểu câu hỏi. Bạn có thể hỏi về giá vé, lịch chạy xe, hoặc đề xuất tuyến phù hợp.");
        }
        Intent intent = detectIntent(userMessage);
        String response = switch (intent) {
            case FARE_LOOKUP -> handleFareLookup(userId, userMessage);
            case SCHEDULE_LOOKUP -> handleScheduleLookup(userId, userMessage);
            case ROUTE_SUGGESTION -> handleRouteSuggestion(userId, userMessage);
            case GREETING -> "Xin chào! Mình là trợ lý ảo UniBus. Mình có thể giúp bạn:\n"
                    + "- Tra cứu giá vé (vé lẻ, vé tháng)\n"
                    + "- Xem lịch chạy xe và giờ xuất phát\n"
                    + "- Gợi ý tuyến xe phù hợp với bạn\n\n"
                    + "Bạn muốn biết gì?";
            case HELP -> "Mình có thể giúp bạn tra cứu:\n"
                    + "• Giá vé - ví dụ: 'Giá vé tuyến 1 bao nhiêu?' hoặc 'Vé tháng tuyến 2 giá gì?'\n"
                    + "• Lịch chạy - ví dụ: 'Lịch chạy tuyến 1', 'Mấy giờ chuyến cuối?'\n"
                    + "• Gợi ý tuyến - ví dụ: 'Gợi ý tuyến xe cho mình', 'Tuyến nào phù hợp?'\n"
                    + "• Chào hỏi - ví dụ: 'Xin chào', 'Hello'";
            case OTHER -> defaultFallback();
        };
        persistTurn(userId, "USER", intent.name(), userMessage, null);
        return persistTurn(userId, "AI", intent.name(), null, response);
    }

    private Intent detectIntent(String message) {
        String m = message.toLowerCase().trim();
        if (m.contains("chào") || m.contains("hello") || m.contains("hi") || m.equals("xin chào")) {
            return Intent.GREETING;
        }
        if (m.contains("giá vé") || m.contains("bao nhiêu tiền") || m.contains("giá tiền")
                || m.contains("giá") && (m.contains("vé") || m.contains("tháng"))) {
            return Intent.FARE_LOOKUP;
        }
        if (m.contains("lịch") || m.contains("mấy giờ") || m.contains("giờ chạy")
                || m.contains("chuyến") || m.contains("xuất phát") || m.contains("khởi hành")) {
            return Intent.SCHEDULE_LOOKUP;
        }
        if (m.contains("tuyến") || m.contains("đường") || m.contains("gợi ý")
                || m.contains("đề xuất") || m.contains("phù hợp")) {
            return Intent.ROUTE_SUGGESTION;
        }
        if (m.contains("giúp") || m.contains("help") || m.contains("hỗ trợ")) {
            return Intent.HELP;
        }
        return Intent.OTHER;
    }

    private String handleFareLookup(Integer userId, String message) {
        Optional<Integer> routeId = extractRouteNumber(message);
        if (routeId.isEmpty()) {
            return "Để mình tra giá vé, bạn vui lòng nói rõ số tuyến. Ví dụ: 'Giá vé tuyến 1' hoặc 'Vé tháng tuyến 3 bao nhiêu?'";
        }
        Map<String, Object> fares = lookupFares(routeId.get());
        if (fares.isEmpty()) {
            return "Mình không tìm thấy thông tin giá vé cho tuyến " + routeId.get() + ". Vui lòng kiểm tra lại số tuyến.";
        }
        BigDecimal single = (BigDecimal) fares.get("single");
        BigDecimal monthly = (BigDecimal) fares.get("monthly");
        String routeName = (String) fares.getOrDefault("routeName", "");
        boolean wantMonthly = message.toLowerCase().contains("tháng");
        StringBuilder sb = new StringBuilder();
        sb.append("💰 Thông tin giá vé tuyến ").append(routeId.get());
        if (!routeName.isBlank()) sb.append(" (").append(routeName).append(")");
        sb.append(":\n");
        if (single != null && !wantMonthly) {
            sb.append("• Vé lẻ: ").append(String.format("%,.0f", single)).append(" VND/chuyến\n");
        }
        if (monthly != null) {
            sb.append("• Vé tháng: ").append(String.format("%,.0f", monthly)).append(" VND/tháng\n");
        }
        sb.append("\nBạn có thể mua vé trực tiếp trên ứng dụng. Cần hỗ trợ gì nữa không?");
        return sb.toString();
    }

    private String handleScheduleLookup(Integer userId, String message) {
        Optional<Integer> routeId = extractRouteNumber(message);
        if (routeId.isEmpty()) {
            return "Để mình tra lịch chạy, bạn vui lòng nói rõ số tuyến. Ví dụ: 'Lịch chạy tuyến 1' hoặc 'Tuyến 2 mấy giờ có chuyến cuối?'";
        }
        Map<String, Object> schedule = lookupSchedule(routeId.get());
        if (schedule.isEmpty()) {
            return "Mình không tìm thấy lịch chạy cho tuyến " + routeId.get() + ". Vui lòng kiểm tra lại.";
        }
        String routeName = (String) schedule.getOrDefault("routeName", "");
        LocalTime first = (LocalTime) schedule.get("first");
        LocalTime last = (LocalTime) schedule.get("last");
        Long tripCount = (Long) schedule.get("tripCount");
        Integer frequency = (Integer) schedule.get("frequency");
        StringBuilder sb = new StringBuilder();
        sb.append("🕒 Lịch chạy tuyến ").append(routeId.get());
        if (!routeName.isBlank()) sb.append(" (").append(routeName).append(")");
        sb.append(":\n");
        if (first != null) sb.append("• Chuyến đầu: ").append(first.toString().substring(0, 5)).append("\n");
        if (last != null) sb.append("• Chuyến cuối: ").append(last.toString().substring(0, 5)).append("\n");
        if (tripCount != null) sb.append("• Số chuyến/ngày: ").append(tripCount).append("\n");
        if (frequency != null) sb.append("• Tần suất: mỗi ").append(frequency).append(" phút/chuyến\n");
        sb.append("\nBạn có thể xem danh sách trạm và ETA chi tiết trong mục Tuyến xe.");
        return sb.toString();
    }

    private String handleRouteSuggestion(Integer userId, String message) {
        List<RouteSuggestionService.RouteSuggestionCard> suggestions =
                routeSuggestionService.suggest(userId, null, null, message);
        if (suggestions.isEmpty()) {
            return "Hiện tại bạn chưa có tuyến xe nào được liên kết với trường đại học. "
                    + "Vui lòng hoàn tất xác thực sinh viên và đợi trường của bạn được liên kết với tuyến xe để nhận gợi ý.";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("🚌 Top ").append(Math.min(3, suggestions.size())).append(" tuyến xe phù hợp với bạn:\n\n");
        for (int i = 0; i < Math.min(3, suggestions.size()); i++) {
            RouteSuggestionService.RouteSuggestionCard r = suggestions.get(i);
            sb.append(i + 1).append(". Tuyến ").append(r.routeId);
            if (r.routeName != null && !r.routeName.isBlank()) sb.append(" - ").append(r.routeName);
            sb.append("\n");
            if (r.reasons != null && !r.reasons.isBlank()) {
                sb.append("   Lý do: ").append(r.reasons).append("\n");
            }
            if (r.finalFare != null) {
                sb.append("   Vé tháng: ").append(String.format("%,.0f", r.finalFare)).append(" VND\n");
            }
            sb.append("\n");
        }
        sb.append("Bạn có thể đăng ký tuyến ngay từ danh sách. Cần hỗ trợ gì nữa không?");
        return sb.toString();
    }

    private String defaultFallback() {
        return "Xin lỗi, mình chưa hiểu câu hỏi của bạn. Mình có thể giúp:\n"
                + "• Tra giá vé - ví dụ: 'Giá vé tuyến 1?'\n"
                + "• Tra lịch chạy - ví dụ: 'Lịch chạy tuyến 2?'\n"
                + "• Gợi ý tuyến - ví dụ: 'Gợi ý tuyến cho mình?'\n"
                + "Gõ 'giúp' để xem danh sách câu hỏi mẫu.";
    }

    private Optional<Integer> extractRouteNumber(String message) {
        String lower = message.toLowerCase();
        // Match "tuyến X" or " tuyến X " or "tuyến số X"
        java.util.regex.Pattern p = java.util.regex.Pattern.compile("tuyến\\s*(?:số\\s*)?(\\d+)");
        java.util.regex.Matcher m = p.matcher(lower);
        if (m.find()) {
            try {
                return Optional.of(Integer.parseInt(m.group(1)));
            } catch (NumberFormatException ignored) {
            }
        }
        // Try bare number after route keyword
        p = java.util.regex.Pattern.compile("(?:route|line)\\s*(\\d+)");
        m = p.matcher(lower);
        if (m.find()) {
            try {
                return Optional.of(Integer.parseInt(m.group(1)));
            } catch (NumberFormatException ignored) {
            }
        }
        return Optional.empty();
    }

    private Map<String, Object> lookupFares(Integer routeId) {
        Map<String, Object> result = new HashMap<>();
        try {
            jdbcTemplate.queryForObject("SELECT route_name FROM routes WHERE route_id = ?",
                    String.class, routeId);
            result.put("routeName", jdbcTemplate.queryForObject(
                    "SELECT route_name FROM routes WHERE route_id = ?", String.class, routeId));
        } catch (Exception e) {
            return Map.of();
        }
        try {
            BigDecimal single = jdbcTemplate.queryForObject("""
                    SELECT amount FROM fares
                    WHERE route_id = ? AND fare_type = 'SINGLE'
                      AND effective_from <= CURRENT_DATE
                      AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
                    ORDER BY effective_from DESC LIMIT 1
                    """, BigDecimal.class, routeId);
            result.put("single", single);
        } catch (Exception ignored) {
        }
        try {
            BigDecimal monthly = jdbcTemplate.queryForObject("""
                    SELECT amount FROM fares
                    WHERE route_id = ? AND fare_type = 'MONTHLY'
                      AND effective_from <= CURRENT_DATE
                      AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
                    ORDER BY effective_from DESC LIMIT 1
                    """, BigDecimal.class, routeId);
            result.put("monthly", monthly);
        } catch (Exception ignored) {
        }
        return result;
    }

    private Map<String, Object> lookupSchedule(Integer routeId) {
        Map<String, Object> result = new HashMap<>();
        try {
            result.put("routeName", jdbcTemplate.queryForObject(
                    "SELECT route_name FROM routes WHERE route_id = ?", String.class, routeId));
        } catch (Exception e) {
            return Map.of();
        }
        try {
            result.putAll(jdbcTemplate.queryForMap("""
                    SELECT MIN(departure_time) AS first, MAX(departure_time) AS last,
                           COUNT(*) AS trip_count
                    FROM bus_schedules
                    WHERE route_id = ? AND status = 'ACTIVE'
                    """, routeId));
        } catch (Exception ignored) {
        }
        try {
            Integer freq = jdbcTemplate.queryForObject(
                    "SELECT frequency_min FROM routes WHERE route_id = ?", Integer.class, routeId);
            result.put("frequency", freq);
        } catch (Exception ignored) {
        }
        return result;
    }

    private ChatTurn persistTurn(Integer userId, String role, String advisoryType,
            String userContent, String aiContent) {
        String sessionId = jdbcTemplate.query("""
                SELECT chat_session_id FROM ai_chat_history
                WHERE user_id = ?
                ORDER BY sent_at DESC LIMIT 1
                """, (rs, rowNum) -> rs.getString("chat_session_id"), userId).stream()
                .findFirst()
                .orElse(UUID.randomUUID().toString());
        String content = role.equals("USER") ? userContent : aiContent;
        Long id = jdbcTemplate.queryForObject("""
                INSERT INTO ai_chat_history (user_id, chat_session_id, message_role, content, advisory_type, sent_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                RETURNING chat_history_id
                """, Long.class, userId, sessionId, role, content, advisoryType);
        return new ChatTurn(id, role, advisoryType, content, sessionId, java.time.OffsetDateTime.now());
    }

    public enum Intent {
        GREETING, FARE_LOOKUP, SCHEDULE_LOOKUP, ROUTE_SUGGESTION, HELP, OTHER
    }

    public record ChatTurn(Long chatHistoryId, String role, String advisoryType, String content,
            String sessionId, java.time.OffsetDateTime sentAt) {
    }
}
