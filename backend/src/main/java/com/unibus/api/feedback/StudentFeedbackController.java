package com.unibus.api.feedback;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.feedback.FeedbackDtos.CreateFeedbackRequest;
import com.unibus.api.feedback.FeedbackDtos.FeedbackView;
import com.unibus.api.security.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/students/me/feedback")
@PreAuthorize("hasRole('STUDENT')")
public class StudentFeedbackController {

    private final FeedbackService feedbackService;

    public StudentFeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @GetMapping
    ApiResponse<List<FeedbackView>> listMine(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok("Feedback retrieved", feedbackService.listMine(currentUser, page, size));
    }

    @PostMapping
    ApiResponse<FeedbackView> create(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody CreateFeedbackRequest request) {
        return ApiResponse.ok("Feedback submitted", feedbackService.create(currentUser, request));
    }
}
