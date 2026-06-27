package com.unibus.api.ai;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.Optional;

import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import com.unibus.api.ai.AiDtos.ChatRequest;
import com.unibus.api.ai.AiDtos.ChatResponse;
import com.unibus.api.ai.AiDtos.RouteSuggestionRequest;
import com.unibus.api.ai.AiLlmService.LlmResult;

class AiCopilotServiceTests {

    private JdbcTemplate jdbcTemplate;
    private RouteSuggestionService routeSuggestionService;
    private ChatbotService chatbotService;
    private String fakeProvider;

    @BeforeEach
    void setUp() {
        JdbcDataSource dataSource = new JdbcDataSource();
        dataSource.setURL("jdbc:h2:mem:ai-copilot;MODE=PostgreSQL;NON_KEYWORDS=VALUE;DB_CLOSE_DELAY=-1");
        jdbcTemplate = new JdbcTemplate(dataSource);
        createTables();
        seedData();
        AiKnowledgeRepository knowledgeRepository = new AiKnowledgeRepository(jdbcTemplate);
        routeSuggestionService = new RouteSuggestionService(knowledgeRepository);
        fakeProvider = "bedrock";
        AiLlmService fakeLlm = prompt -> Optional.of(new LlmResult(
                "{\"message\":\"LLM đã chọn tuyến tốt nhất từ dữ liệu UniBus.\",\"advisoryType\":\"ROUTE_SUGGESTION\"}",
                fakeProvider,
                "test-model"));
        chatbotService = new ChatbotService(
                jdbcTemplate,
                knowledgeRepository,
                routeSuggestionService,
                fakeLlm);
    }

    @Test
    void routeSuggestionsPreferDirectStopMatchWithSubsidyData() {
        var suggestions = routeSuggestionService.suggest(1, new RouteSuggestionRequest(
                10,
                20,
                "07:00",
                java.util.List.of("fast", "cheap"),
                "Tuyến nào nhanh và rẻ nhất?",
                null));

        assertThat(suggestions).isNotEmpty();
        assertThat(suggestions.getFirst().routeId()).isEqualTo(100);
        assertThat(suggestions).extracting("routeId").doesNotContain(200);
        assertThat(suggestions.getFirst().reasons()).contains("Đi qua đúng trạm lên và trạm xuống");
        assertThat(suggestions.getFirst().subsidyAmount()).isPositive();
        assertThat(suggestions.getFirst().actions()).extracting("type")
                .contains("REGISTER_ROUTE", "BUY_MONTHLY_PASS", "VIEW_ETA");
    }

    @Test
    void routeSuggestionsIncludeActiveDirectRouteOutsideStudentUniversityLink() {
        var suggestions = routeSuggestionService.suggest(1, new RouteSuggestionRequest(
                30,
                20,
                "07:00",
                java.util.List.of("fast"),
                "Đi từ Trung tâm đến Cổng trường",
                null));

        assertThat(suggestions).extracting("routeId").containsExactly(300);
        assertThat(suggestions.getFirst().reasons()).contains("Đi qua đúng trạm lên và trạm xuống");
    }

    @Test
    void chatResolvesNamedStopsOnRouteOutsideStudentUniversityLink() {
        ChatResponse response = chatbotService.respond(1, new ChatRequest(
                "Tôi muốn đi từ Trung tâm đến Cổng trường",
                Map.of()));

        assertThat(response.routeSuggestions()).extracting("routeId").containsExactly(300);
        assertThat(response.sources()).extracting("type").contains("ROUTE_SUGGESTIONS");
    }

    @Test
    void chatSelectsRouteCompatibleCampusStopsWhenAliasesAreAmbiguous() {
        ChatResponse response = chatbotService.respond(1, new ChatRequest(
                "Tôi đang ở Đại học Bách khoa Đà Nẵng và muốn đến Đại học FPT. Hãy tìm tuyến phù hợp, so sánh giá sau trợ giá, liệt kê các trạm dừng và cho biết chuyến gần nhất.",
                Map.of()));

        assertThat(response.routeSuggestions()).extracting("routeId").containsExactly(400);
        assertThat(response.sources()).extracting("type").contains("ROUTE_SUGGESTIONS");
    }

    @Test
    void chatUsesLlmResponseAndPersistsBothTurns() {
        ChatResponse response = chatbotService.respond(1, new ChatRequest(
                "Sáng nay tôi muốn tới trường, tuyến nào nhanh và rẻ nhất?",
                Map.of(
                        "boardingStopId", 10,
                        "alightingStopId", 20,
                        "preferredDepartureTime", "07:00",
                        "preferences", java.util.List.of("fast", "cheap"))));

        assertThat(response.mode()).isEqualTo("BEDROCK");
        assertThat(response.message()).contains("LLM");
        assertThat(response.routeSuggestions()).isNotEmpty();
        Integer turns = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ai_chat_history", Integer.class);
        assertThat(turns).isEqualTo(2);
    }

    @Test
    void chatModeReflectsSelectedLlmProvider() {
        fakeProvider = "zai";

        ChatResponse response = chatbotService.respond(1, new ChatRequest(
                "Gợi ý tuyến đi học giúp tôi",
                Map.of()));

        assertThat(response.mode()).isEqualTo("ZAI");
    }

    private void createTables() {
        jdbcTemplate.execute("DROP ALL OBJECTS");
        jdbcTemplate.execute("""
                CREATE TABLE users (
                    user_id INTEGER PRIMARY KEY,
                    email VARCHAR(100),
                    full_name VARCHAR(100),
                    student_verification_status VARCHAR(30)
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE universities (
                    university_id INTEGER PRIMARY KEY,
                    name VARCHAR(150)
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE students (
                    student_code VARCHAR(20) PRIMARY KEY,
                    user_id INTEGER,
                    university VARCHAR(150),
                    university_id INTEGER
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE routes (
                    route_id INTEGER PRIMARY KEY,
                    route_code VARCHAR(50),
                    route_name VARCHAR(150),
                    color_hex VARCHAR(20),
                    distance_km DECIMAL(10,2),
                    estimated_minutes INTEGER,
                    frequency_min INTEGER,
                    status VARCHAR(20)
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE route_universities (
                    route_university_id INTEGER PRIMARY KEY,
                    route_id INTEGER,
                    university_id INTEGER,
                    active_from DATE,
                    active_until DATE,
                    status VARCHAR(20)
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE stops (
                    stop_id INTEGER PRIMARY KEY,
                    stop_code VARCHAR(50),
                    stop_name VARCHAR(150),
                    status VARCHAR(20)
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE route_stops (
                    route_stop_id INTEGER PRIMARY KEY,
                    route_id INTEGER,
                    stop_id INTEGER,
                    stop_order INTEGER,
                    minutes_from_previous_stop INTEGER
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE fares (
                    fare_id INTEGER PRIMARY KEY,
                    route_id INTEGER,
                    fare_type VARCHAR(20),
                    amount DECIMAL(12,2),
                    effective_from DATE,
                    effective_until DATE
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE subsidy_policies (
                    subsidy_policy_id INTEGER PRIMARY KEY,
                    university_id INTEGER,
                    subsidy_type VARCHAR(30),
                    value DECIMAL(12,2),
                    max_amount DECIMAL(12,2),
                    active_from DATE,
                    active_until DATE,
                    status VARCHAR(20)
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE bus_schedules (
                    schedule_id INTEGER PRIMARY KEY,
                    route_id INTEGER,
                    weekday_number INTEGER,
                    departure_time TIME,
                    status VARCHAR(20)
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE route_registrations (
                    registration_id INTEGER PRIMARY KEY,
                    student_code VARCHAR(20),
                    route_id INTEGER,
                    boarding_stop_id INTEGER,
                    alighting_stop_id INTEGER,
                    status VARCHAR(20),
                    effective_date DATE,
                    registered_at TIMESTAMP
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE monthly_passes (
                    monthly_pass_id INTEGER PRIMARY KEY,
                    student_code VARCHAR(20),
                    route_id INTEGER,
                    fare_amount DECIMAL(12,2),
                    final_fare_amount DECIMAL(12,2),
                    status VARCHAR(20),
                    expires_on DATE
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE ai_chat_history (
                    chat_history_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    user_id INTEGER,
                    chat_session_id UUID,
                    message_role VARCHAR(20),
                    content VARCHAR(4000),
                    advisory_type VARCHAR(40),
                    sent_at TIMESTAMP
                )
                """);
    }

    private void seedData() {
        jdbcTemplate.update("INSERT INTO users VALUES (1, 'student@example.com', 'Demo Student', 'VERIFIED')");
        jdbcTemplate.update("INSERT INTO universities VALUES (1, 'UniBus Demo University')");
        jdbcTemplate.update("INSERT INTO students VALUES ('SV001', 1, 'UniBus Demo University', 1)");
        jdbcTemplate.update("INSERT INTO routes VALUES (100, 'R1', 'Campus Express', '#144fcc', 8.5, 25, 10, 'ACTIVE')");
        jdbcTemplate.update("INSERT INTO routes VALUES (200, 'R2', 'City Loop', '#beff50', 15.0, 45, 25, 'ACTIVE')");
        jdbcTemplate.update("INSERT INTO routes VALUES (300, 'R3', 'Cross Campus', '#ff8c5f', 10.0, 30, 15, 'ACTIVE')");
        jdbcTemplate.update("INSERT INTO routes VALUES (400, 'UB-DN-01', 'UniBus 01: Bách khoa - FPT', '#1565C0', 28.4, 58, 15, 'ACTIVE')");
        jdbcTemplate.update("INSERT INTO route_universities VALUES (1, 100, 1, CURRENT_DATE - 1, NULL, 'ACTIVE')");
        jdbcTemplate.update("INSERT INTO route_universities VALUES (2, 200, 1, CURRENT_DATE - 1, NULL, 'ACTIVE')");
        jdbcTemplate.update("INSERT INTO stops VALUES (10, 'S10', 'Ký túc xá', 'ACTIVE')");
        jdbcTemplate.update("INSERT INTO stops VALUES (20, 'S20', 'Cổng trường', 'ACTIVE')");
        jdbcTemplate.update("INSERT INTO stops VALUES (30, 'S30', 'Trung tâm', 'ACTIVE')");
        jdbcTemplate.update("INSERT INTO stops VALUES (40, 'DN-ST-BKDN', 'Đại học Bách khoa Đà Nẵng', 'ACTIVE')");
        jdbcTemplate.update("INSERT INTO stops VALUES (41, 'DN-ST-FPT-GATE', 'Cổng khu đô thị FPT', 'ACTIVE')");
        jdbcTemplate.update("INSERT INTO stops VALUES (42, 'DN-ST-FPT', 'Đại học FPT Đà Nẵng', 'ACTIVE')");
        jdbcTemplate.update("INSERT INTO route_stops VALUES (1, 100, 10, 1, 0)");
        jdbcTemplate.update("INSERT INTO route_stops VALUES (2, 100, 20, 2, 12)");
        jdbcTemplate.update("INSERT INTO route_stops VALUES (3, 200, 10, 1, 0)");
        jdbcTemplate.update("INSERT INTO route_stops VALUES (4, 200, 30, 2, 20)");
        jdbcTemplate.update("INSERT INTO route_stops VALUES (5, 300, 30, 1, 0)");
        jdbcTemplate.update("INSERT INTO route_stops VALUES (6, 300, 20, 2, 15)");
        jdbcTemplate.update("INSERT INTO route_stops VALUES (7, 400, 40, 1, 0)");
        jdbcTemplate.update("INSERT INTO route_stops VALUES (8, 400, 42, 2, 58)");
        jdbcTemplate.update("INSERT INTO fares VALUES (1, 100, 'SINGLE', 7000, CURRENT_DATE - 1, NULL)");
        jdbcTemplate.update("INSERT INTO fares VALUES (2, 100, 'MONTHLY', 120000, CURRENT_DATE - 1, NULL)");
        jdbcTemplate.update("INSERT INTO fares VALUES (3, 200, 'MONTHLY', 150000, CURRENT_DATE - 1, NULL)");
        jdbcTemplate.update("INSERT INTO fares VALUES (4, 400, 'SINGLE', 7000, CURRENT_DATE - 1, NULL)");
        jdbcTemplate.update("INSERT INTO fares VALUES (5, 400, 'MONTHLY', 120000, CURRENT_DATE - 1, NULL)");
        jdbcTemplate.update("INSERT INTO subsidy_policies VALUES (1, 1, 'PERCENTAGE', 25, 50000, CURRENT_DATE - 1, NULL, 'ACTIVE')");
        int weekday = java.time.LocalDate.now().getDayOfWeek().getValue();
        jdbcTemplate.update("INSERT INTO bus_schedules VALUES (1, 100, ?, '07:30:00', 'ACTIVE')", weekday);
        jdbcTemplate.update("INSERT INTO bus_schedules VALUES (2, 100, ?, '08:00:00', 'ACTIVE')", weekday);
        jdbcTemplate.update("INSERT INTO bus_schedules VALUES (3, 400, ?, '07:30:00', 'ACTIVE')", weekday);
    }
}
