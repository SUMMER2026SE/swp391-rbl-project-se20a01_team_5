package com.unibus.api.experience;

import static com.unibus.api.experience.ExperienceDtos.*;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1")
public class ExperienceController {

    private final ExperienceService service;

    public ExperienceController(ExperienceService service) {
        this.service = service;
    }

    @GetMapping("/students/me/dashboard")
    @PreAuthorize("hasRole('STUDENT')")
    ApiResponse<StudentDashboardView> studentDashboard(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Student dashboard retrieved", service.studentDashboard(currentUser));
    }

    @GetMapping("/students/me/route-suggestions")
    @PreAuthorize("hasRole('STUDENT')")
    ApiResponse<List<RouteCard>> studentRouteSuggestions(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Route suggestions retrieved", service.studentRouteSuggestions(currentUser));
    }

    @GetMapping("/students/me/lost-items")
    @PreAuthorize("hasRole('STUDENT')")
    ApiResponse<List<LostItemCard>> studentLostItems(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Lost items retrieved", service.studentLostItems(currentUser));
    }

    @PostMapping("/students/me/lost-items")
    @PreAuthorize("hasRole('STUDENT')")
    ApiResponse<LostItemCard> createStudentLostItem(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody CreateLostItemRequest request) {
        return ApiResponse.ok("Lost item reported", service.createStudentLostItem(currentUser, request));
    }

    @GetMapping("/students/me/support-tickets")
    @PreAuthorize("hasRole('STUDENT')")
    ApiResponse<List<SupportTicketCard>> supportTickets(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Support tickets retrieved", service.supportTickets(currentUser));
    }

    @PostMapping("/students/me/support-tickets")
    @PreAuthorize("hasRole('STUDENT')")
    ApiResponse<SupportTicketCard> createSupportTicket(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody CreateSupportTicketRequest request) {
        return ApiResponse.ok("Support ticket created", service.createSupportTicket(currentUser, request));
    }

    @GetMapping("/students/me/assistant-chat")
    @PreAuthorize("hasRole('STUDENT')")
    ApiResponse<List<ChatMessageCard>> assistantChat(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Assistant chat retrieved", service.assistantChat(currentUser));
    }

    @GetMapping("/driver/dashboard")
    @PreAuthorize("hasRole('DRIVER')")
    ApiResponse<DriverDashboardView> driverDashboard(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Driver dashboard retrieved", service.driverDashboard(currentUser));
    }

    @GetMapping("/driver/feedback")
    @PreAuthorize("hasRole('DRIVER')")
    ApiResponse<List<FeedbackCard>> driverFeedback(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Driver feedback retrieved", service.driverFeedback(currentUser));
    }

    @GetMapping("/conductor/dashboard")
    @PreAuthorize("hasRole('CONDUCTOR')")
    ApiResponse<AssistantDashboardView> assistantDashboard(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Conductor dashboard retrieved", service.assistantDashboard(currentUser));
    }

    @GetMapping("/conductor/incidents")
    @PreAuthorize("hasRole('CONDUCTOR')")
    ApiResponse<List<IncidentCard>> incidents(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Incidents retrieved", service.incidents(currentUser));
    }

    @PostMapping("/conductor/incidents")
    @PreAuthorize("hasRole('CONDUCTOR')")
    ApiResponse<IncidentCard> createIncident(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody CreateIncidentRequest request) {
        return ApiResponse.ok("Incident reported", service.createIncident(currentUser, request));
    }

    @GetMapping("/conductor/lost-items")
    @PreAuthorize("hasRole('CONDUCTOR')")
    ApiResponse<List<LostItemCard>> assistantLostItems(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Lost item queue retrieved", service.assistantLostItems(currentUser));
    }

    @PutMapping("/conductor/lost-items/{lostItemId}")
    @PreAuthorize("hasRole('CONDUCTOR')")
    ApiResponse<LostItemCard> updateLostItem(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer lostItemId,
            @Valid @RequestBody UpdateLostItemStatusRequest request) {
        return ApiResponse.ok("Lost item updated", service.updateAssistantLostItem(currentUser, lostItemId, request));
    }

    @GetMapping("/coordinator/dashboard")
    @PreAuthorize("hasAnyRole('DISPATCHER', 'ADMIN')")
    ApiResponse<CoordinatorDashboardView> coordinatorDashboard() {
        return ApiResponse.ok("Coordinator dashboard retrieved", service.coordinatorDashboard());
    }

    @GetMapping("/coordinator/experience-feedback")
    @PreAuthorize("hasAnyRole('DISPATCHER', 'ADMIN')")
    ApiResponse<List<FeedbackCard>> coordinatorFeedback(@RequestParam(required = false) String status) {
        return ApiResponse.ok("Coordinator feedback retrieved", service.coordinatorFeedback(status));
    }

    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<AdminStatsView> adminStats() {
        return ApiResponse.ok("Admin stats retrieved", service.adminStats());
    }

    @GetMapping("/admin/fares")
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<List<FareCard>> fares() {
        return ApiResponse.ok("Fares retrieved", service.fares());
    }

    @PutMapping("/admin/fares/{fareId}")
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<FareCard> updateFare(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer fareId,
            @Valid @RequestBody UpdateFareRequest request) {
        return ApiResponse.ok("Fare updated", service.updateFare(currentUser, fareId, request));
    }

    @GetMapping("/admin/complaints")
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<List<ComplaintCard>> complaints(@RequestParam(required = false) String status) {
        return ApiResponse.ok("Complaints retrieved", service.complaints(status));
    }

    @GetMapping("/admin/violations")
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<List<ViolationCard>> violations(@RequestParam(required = false) String status) {
        return ApiResponse.ok("Violations retrieved", service.violations(status));
    }

    // ===== Internal messaging (REQ-DRV-006, REQ-AST-007) =====

    @PostMapping("/me/messages")
    @PreAuthorize("hasAnyRole('DRIVER', 'CONDUCTOR', 'DISPATCHER', 'ADMIN')")
    ApiResponse<java.util.Map<String, Object>> sendMessage(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody SendInternalMessageRequest request) {
        Long id = service.sendMessage(currentUser, request);
        return ApiResponse.ok("Message sent", java.util.Map.of("messageId", id));
    }

    @GetMapping("/me/messages/threads")
    @PreAuthorize("hasAnyRole('DRIVER', 'CONDUCTOR', 'DISPATCHER', 'ADMIN')")
    ApiResponse<List<ContactThreadCard>> messageThreads(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Message threads retrieved", service.contactThreads(currentUser));
    }

    @GetMapping("/me/messages/{peerUserId}")
    @PreAuthorize("hasAnyRole('DRIVER', 'CONDUCTOR', 'DISPATCHER', 'ADMIN')")
    ApiResponse<List<InternalMessageCard>> conversation(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer peerUserId) {
        List<InternalMessageCard> msgs = service.conversation(currentUser, peerUserId);
        // mark as read on view
        service.markRead(currentUser, peerUserId);
        return ApiResponse.ok("Conversation retrieved", msgs);
    }

    @PostMapping("/me/messages/{peerUserId}/read")
    @PreAuthorize("hasAnyRole('DRIVER', 'CONDUCTOR', 'DISPATCHER', 'ADMIN')")
    ApiResponse<java.util.Map<String, Object>> markConversationRead(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer peerUserId) {
        service.markRead(currentUser, peerUserId);
        return ApiResponse.ok("Marked as read", java.util.Map.of());
    }
}
