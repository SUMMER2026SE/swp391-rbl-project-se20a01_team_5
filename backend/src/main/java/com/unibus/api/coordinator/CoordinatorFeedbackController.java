package com.unibus.api.coordinator;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.feedback.FeedbackDtos.FeedbackView;
import com.unibus.api.feedback.FeedbackDtos.ResolveFeedbackRequest;
import com.unibus.api.feedback.FeedbackService;
import com.unibus.api.security.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/coordinator/feedback")
@PreAuthorize("hasRole('DISPATCHER')")
public class CoordinatorFeedbackController {

    private final FeedbackService feedbackService;

    public CoordinatorFeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @GetMapping
    public ApiResponse<List<FeedbackView>> listFeedbacks(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.ok("Feedbacks retrieved", feedbackService.listAll(status, page, size));
    }

    @PatchMapping("/{feedbackId}/resolve")
    public ApiResponse<FeedbackView> resolveFeedback(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Long feedbackId,
            @Valid @RequestBody(required = false) ResolveFeedbackRequest request) {
        return ApiResponse.ok("Feedback resolved", feedbackService.resolve(currentUser, feedbackId, request));
    }
}
