package com.unibus.api.feedback;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.feedback.FeedbackDtos.CreateFeedbackRequest;
import com.unibus.api.feedback.FeedbackDtos.FeedbackView;
import com.unibus.api.feedback.FeedbackDtos.ResolveFeedbackRequest;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.user.StudentRepository;
import com.unibus.api.user.model.Student;

@Service
public class FeedbackService {

    private static final String DEFAULT_CATEGORY = "SERVICE_QUALITY";

    private final StudentRepository studentRepository;
    private final FeedbackRepository feedbackRepository;

    public FeedbackService(StudentRepository studentRepository, FeedbackRepository feedbackRepository) {
        this.studentRepository = studentRepository;
        this.feedbackRepository = feedbackRepository;
    }

    @Transactional
    public FeedbackView create(CurrentUser currentUser, CreateFeedbackRequest request) {
        currentStudent(currentUser);
        if (request.tripId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Feedback requires trip");
        }
        if (feedbackRepository.existsByUserIdAndTripId(currentUser.userId(), request.tripId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Bạn đã đánh giá chuyến này");
        }
        String category = normalizeCategory(request.category());
        return feedbackRepository.create(
                currentUser.userId(),
                request.tripId(),
                request.routeId(),
                request.rating(),
                category,
                request.content().trim());
    }

    @Transactional(readOnly = true)
    public List<FeedbackView> listMine(CurrentUser currentUser, int page, int size) {
        validatePage(page, size);
        currentStudent(currentUser);
        return feedbackRepository.findByUserId(currentUser.userId(), size, page * size);
    }

    @Transactional(readOnly = true)
    public List<FeedbackView> listAll(String status, int page, int size) {
        validatePage(page, size);
        return feedbackRepository.findAll(status, size, page * size);
    }

    @Transactional
    public FeedbackView resolve(CurrentUser currentUser, Long feedbackId, ResolveFeedbackRequest request) {
        if (!feedbackRepository.exists(feedbackId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Feedback not found");
        }
        String response = request == null || request.response() == null ? null : request.response().trim();
        return feedbackRepository.resolve(feedbackId, currentUser.userId(), response);
    }

    private Student currentStudent(CurrentUser currentUser) {
        return studentRepository.findByUserId(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile not found"));
    }

    private String normalizeCategory(String category) {
        String normalized = category == null || category.isBlank()
                ? DEFAULT_CATEGORY
                : category.trim().toUpperCase();
        if (normalized.length() > 40) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Feedback category is too long");
        }
        return normalized;
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Page must be non-negative and size must be between 1 and 100");
        }
    }
}
