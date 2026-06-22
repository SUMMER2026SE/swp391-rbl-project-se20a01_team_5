package com.unibus.api.experience;

import static com.unibus.api.experience.ExperienceDtos.*;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;

@Service
public class ExperienceService {

    private final ExperienceRepository repository;

    public ExperienceService(ExperienceRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public StudentDashboardView studentDashboard(CurrentUser currentUser) {
        return repository.studentDashboard(currentUser.userId());
    }

    @Transactional(readOnly = true)
    public List<RouteCard> studentRouteSuggestions(CurrentUser currentUser) {
        return repository.studentDashboard(currentUser.userId()).routes();
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
        return repository.updateLostItem(currentUser.userId(), lostItemId, request);
    }

    @Transactional(readOnly = true)
    public CoordinatorDashboardView coordinatorDashboard() {
        return repository.coordinatorDashboard();
    }

    @Transactional(readOnly = true)
    public List<FeedbackCard> coordinatorFeedback(String status) {
        return repository.allFeedback(status, 50);
    }

    @Transactional(readOnly = true)
    public AdminStatsView adminStats() {
        return repository.adminStats();
    }

    @Transactional(readOnly = true)
    public List<FareCard> fares() {
        return repository.fares();
    }

    @Transactional
    public FareCard updateFare(CurrentUser currentUser, Integer fareId, UpdateFareRequest request) {
        return repository.updateFare(fareId, currentUser.userId(), request);
    }

    @Transactional(readOnly = true)
    public List<ComplaintCard> complaints(String status) {
        return repository.complaints(status, 50);
    }

    @Transactional(readOnly = true)
    public List<ViolationCard> violations(String status) {
        return repository.violations(status, 50);
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
