package com.unibus.api.experience;

import static com.unibus.api.experience.ExperienceDtos.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.realtime.RealtimePublisher;
import com.unibus.api.security.CurrentUser;

@Service
public class ExperienceService {

    private final ExperienceRepository repository;
    private final RealtimePublisher realtimePublisher;

    public ExperienceService(ExperienceRepository repository, RealtimePublisher realtimePublisher) {
        this.repository = repository;
        this.realtimePublisher = realtimePublisher;
    }

    @Transactional(readOnly = true)
    public StudentDashboardView studentDashboard(CurrentUser currentUser) {
        return repository.studentDashboard(currentUser.userId());
    }

    @Transactional(readOnly = true)
    public List<RouteCard> studentRouteSuggestions(CurrentUser currentUser) {
        return repository.studentRouteSuggestions(currentUser.userId());
    }

    @Transactional(readOnly = true)
    public List<LostItemCard> studentLostItems(CurrentUser currentUser) {
        return repository.studentLostItems(currentUser.userId());
    }

    @Transactional
    public LostItemCard createStudentLostItem(CurrentUser currentUser, CreateLostItemRequest request) {
        return repository.createLostItem(currentUser.userId(), request);
    }

    @Transactional(readOnly = true)
    public List<SupportTicketCard> supportTickets(CurrentUser currentUser) {
        return repository.supportTickets(currentUser.userId());
    }

    @Transactional
    public SupportTicketCard createSupportTicket(CurrentUser currentUser, CreateSupportTicketRequest request) {
        return repository.createSupportTicket(currentUser.userId(), request);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageCard> assistantChat(CurrentUser currentUser) {
        return repository.chatHistory(currentUser.userId());
    }

    @Transactional(readOnly = true)
    public DriverDashboardView driverDashboard(CurrentUser currentUser) {
        requireDriver(currentUser);
        return repository.driverDashboard(currentUser.userId());
    }

    @Transactional(readOnly = true)
    public List<FeedbackCard> driverFeedback(CurrentUser currentUser) {
        Integer driverId = requireDriver(currentUser);
        return repository.driverFeedback(driverId, 50);
    }

    @Transactional(readOnly = true)
    public AssistantDashboardView assistantDashboard(CurrentUser currentUser) {
        requireConductor(currentUser);
        return repository.assistantDashboard(currentUser.userId());
    }

    @Transactional
    public IncidentCard createIncident(CurrentUser currentUser, CreateIncidentRequest request) {
        Integer conductorId = requireConductor(currentUser);
        return repository.createIncident(conductorId, request);
    }

    @Transactional(readOnly = true)
    public List<IncidentCard> incidents(CurrentUser currentUser) {
        Integer conductorId = requireConductor(currentUser);
        return repository.incidents(conductorId, 50);
    }

    @Transactional(readOnly = true)
    public List<LostItemCard> assistantLostItems(CurrentUser currentUser) {
        requireConductor(currentUser);
        return repository.lostItemsForAssistant(currentUser.userId(), 50);
    }

    @Transactional
    public LostItemCard updateAssistantLostItem(CurrentUser currentUser, Integer lostItemId,
            UpdateLostItemStatusRequest request) {
        requireConductor(currentUser);
        return repository.updateLostItem(currentUser.userId(), lostItemId, normalizeLostItemStatus(request));
    }

    private UpdateLostItemStatusRequest normalizeLostItemStatus(UpdateLostItemStatusRequest request) {
        String status = switch (request.status().trim().toUpperCase()) {
            case "FOUND", "SEARCHING" -> "FOUND";
            case "RETURNED", "CLOSED" -> "FOUND";
            case "NOT_FOUND" -> "NOT_FOUND";
            case "REPORTED" -> "REPORTED";
            default -> throw new ApiException(HttpStatus.BAD_REQUEST, "Trạng thái đồ thất lạc không hợp lệ");
        };
        return new UpdateLostItemStatusRequest(status, request.notes());
    }

    @Transactional(readOnly = true)
    public CoordinatorDashboardView coordinatorDashboard() {
        return repository.coordinatorDashboard();
    }

    @Transactional(readOnly = true)
    public List<UniversityOperationsMetric> coordinatorByUniversity() {
        return repository.coordinatorByUniversity();
    }

    @Transactional(readOnly = true)
    public List<UniversityRouteOperationsMetric> coordinatorUniversityRoutes(Integer universityId) {
        return repository.coordinatorUniversityRoutes(universityId);
    }

    @Transactional(readOnly = true)
    public List<FeedbackCard> coordinatorFeedback(String status) {
        return repository.allFeedback(status, 50);
    }

    @Transactional(readOnly = true)
    public AdminStatsView adminStats(int days) {
        return repository.adminStats(Math.max(1, Math.min(days, 90)));
    }

    @Transactional(readOnly = true)
    public List<FareCard> fares() {
        return repository.fares();
    }

    @Transactional
    public FareCard updateFare(CurrentUser currentUser, Integer fareId, UpdateFareRequest request) {
        FareCard previous = repository.fares().stream()
                .filter(f -> f.fareId().equals(fareId))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Fare not found"));
        // SRS AC1: Giá mới hiệu lực sau 24h - stage as pending and record history.
        LocalDate effectiveFrom = LocalDate.now().plusDays(1);
        repository.recordFareChange(fareId, previous.routeId(),
                previous.amount(), request.amount(), effectiveFrom,
                currentUser.userId(), request.notes());
        return repository.updateFare(fareId, currentUser.userId(), request);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> fareChangeHistory(Integer routeId) {
        return repository.fareChangeHistory(routeId);
    }

    @Transactional(readOnly = true)
    public List<ComplaintCard> complaints(String status) {
        return repository.complaintsByStatus(status, 50);
    }

    @Transactional
    public Long submitComplaint(CurrentUser currentUser, CreateComplaintRequest request) {
        return repository.createComplaint(currentUser.userId(), request.subject(),
                request.description(), request.category());
    }

    @Transactional
    public boolean resolveComplaint(CurrentUser currentUser, Integer complaintId, ResolveComplaintRequest request) {
        if (!"RESOLVED".equalsIgnoreCase(request.status()) && !"REJECTED".equalsIgnoreCase(request.status())
                && !"CLOSED".equalsIgnoreCase(request.status())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Status must be one of: RESOLVED, REJECTED, CLOSED");
        }
        boolean ok = repository.resolveComplaint(complaintId, currentUser.userId(),
                request.status().toUpperCase(), request.resolution());
        if (!ok) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Complaint not found");
        }
        return true;
    }

    @Transactional(readOnly = true)
    public List<ViolationCard> violations(String status) {
        return repository.violations(status, 50);
    }

    @Transactional
    public Long submitViolation(CurrentUser currentUser, CreateViolationRequest request) {
        return repository.createViolation(currentUser.userId(), request.reportedUserId(),
                request.category(), request.description());
    }

    @Transactional
    public boolean reviewViolation(CurrentUser currentUser, Integer violationId, ReviewViolationRequest request) {
        if (!"ACKNOWLEDGED".equalsIgnoreCase(request.status()) && !"WARNED".equalsIgnoreCase(request.status())
                && !"LOCKED".equalsIgnoreCase(request.status())
                && !"DISMISSED".equalsIgnoreCase(request.status())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Status must be one of: ACKNOWLEDGED, WARNED, LOCKED, DISMISSED");
        }
        boolean ok = repository.reviewViolation(violationId, currentUser.userId(),
                request.status().toUpperCase(), request.actionTaken());
        if (!ok) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Violation not found");
        }
        return true;
    }

    // ===== Driver ratings (REQ-STU-011) =====

    @Transactional
    public void rateDriver(CurrentUser currentUser, RatingRequest request) {
        if (repository.existsDriverRating(currentUser.userId(), request.tripId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Bạn đã đánh giá chuyến này rồi");
        }
        Integer driverId = repository.driverIdForTrip(request.tripId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Trip not found or no driver assigned"));
        repository.createDriverRating(currentUser.userId(), request.tripId(), driverId,
                request.rating(), request.content());
    }

    @Transactional(readOnly = true)
    public List<DriverRatingCard> driverRatings(CurrentUser currentUser) {
        Integer driverId = requireDriver(currentUser);
        return repository.driverRatings(driverId, 50);
    }

    @Transactional(readOnly = true)
    public DriverRatingSummary driverRatingSummary(CurrentUser currentUser) {
        Integer driverId = requireDriver(currentUser);
        return repository.driverRatingSummary(driverId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No ratings yet"));
    }
    // ===== Internal messaging (REQ-DRV-006, REQ-AST-007) =====

    @Transactional
    public Long sendMessage(CurrentUser currentUser, SendInternalMessageRequest request) {
        if (request.recipientUserId().equals(currentUser.userId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot send a message to yourself");
        }
        Long messageId = repository.sendInternalMessage(currentUser.userId(), request.recipientUserId(), request.body());
        // Push to recipient via WebSocket for instant notification
        String senderName = repository.fullName(currentUser.userId());
        realtimePublisher.pushInternalMessage(request.recipientUserId().longValue(), messageId,
                currentUser.userId(), senderName, request.body());
        return messageId;
    }

    @Transactional(readOnly = true)
    public List<InternalMessageCard> conversation(CurrentUser currentUser, Integer peerUserId) {
        return repository.conversation(currentUser.userId(), peerUserId, 100);
    }

    @Transactional
    public void markRead(CurrentUser currentUser, Integer peerUserId) {
        repository.markConversationRead(currentUser.userId(), peerUserId);
    }

    @Transactional(readOnly = true)
    public List<ContactThreadCard> contactThreads(CurrentUser currentUser) {
        return repository.contactThreads(currentUser.userId());
    }

    private Integer requireDriver(CurrentUser currentUser) {
        return repository.driverIdForUser(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Driver profile not found"));
    }

    private Integer requireConductor(CurrentUser currentUser) {
        return repository.conductorIdForUser(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Conductor profile not found"));
    }
}
