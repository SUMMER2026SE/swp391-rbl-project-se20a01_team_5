package com.unibus.api.lostItem;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.lostItem.LostItemDtos.CreateLostItemReportRequest;
import com.unibus.api.lostItem.LostItemDtos.LostItemReportView;
import com.unibus.api.notification.NotificationRepository;
import com.unibus.api.security.CurrentUser;

@Service
public class LostItemService {

    private final LostItemRepository lostItemRepository;
    private final NotificationRepository notificationRepository;

    public LostItemService(LostItemRepository lostItemRepository, NotificationRepository notificationRepository) {
        this.lostItemRepository = lostItemRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public LostItemReportView create(CurrentUser currentUser, CreateLostItemReportRequest request) {
        String studentCode = requireStudentCode(currentUser);
        if (request.tripId() != null && !lostItemRepository.studentTravelledOnTrip(studentCode, request.tripId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Student did not travel on this trip");
        }
        LostItemReportView report = lostItemRepository.create(
                currentUser.userId(),
                request.tripId(),
                request.itemDescription().trim(),
                normalizeNotes(request.notes()));
        notifyHandlers(currentUser.userId(), report);
        return report;
    }

    @Transactional(readOnly = true)
    public List<LostItemReportView> listMine(CurrentUser currentUser, int page, int size) {
        validatePage(page, size);
        requireStudentCode(currentUser);
        return lostItemRepository.findByReporter(currentUser.userId(), size, page * size);
    }

    private String requireStudentCode(CurrentUser currentUser) {
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return lostItemRepository.studentCodeForUser(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Only students can report lost items"));
    }

    private String normalizeNotes(String notes) {
        if (notes == null || notes.isBlank()) {
            return null;
        }
        return notes.trim();
    }

    private void notifyHandlers(Integer reporterUserId, LostItemReportView report) {
        String title = "Báo cáo mất đồ mới";
        String route = report.routeName() == null ? "chuyến xe" : report.routeName();
        String content = "Sinh viên vừa báo mất đồ trên " + route
                + " (chuyến #" + (report.tripId() == null ? "N/A" : report.tripId()) + ")\n"
                + "Vật phẩm: " + report.itemDescription()
                + lostItemNotesLine(report.notes());
        for (Integer recipientUserId : lostItemRepository.findNotificationRecipients(report.tripId())) {
            notificationRepository.createForRecipient(title, content, "ALERT", recipientUserId, reporterUserId);
        }
    }

    private String lostItemNotesLine(String notes) {
        if (notes == null || notes.isBlank()) {
            return "";
        }
        return "\nNội dung: " + notes.trim();
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Page must be non-negative and size must be between 1 and 100");
        }
    }
}
