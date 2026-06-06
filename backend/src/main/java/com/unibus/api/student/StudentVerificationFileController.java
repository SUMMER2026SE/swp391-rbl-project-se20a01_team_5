package com.unibus.api.student;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.security.CurrentUser;
import com.unibus.api.storage.StoredFile;

@RestController
@RequestMapping("/api/v1/student-verifications")
@PreAuthorize("hasAnyRole('STUDENT','ADMIN')")
public class StudentVerificationFileController {

    private final StudentVerificationService studentVerificationService;

    public StudentVerificationFileController(StudentVerificationService studentVerificationService) {
        this.studentVerificationService = studentVerificationService;
    }

    @GetMapping("/{verificationId}/card-image")
    ResponseEntity<byte[]> getCardImage(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Long verificationId) {
        StoredFile image = studentVerificationService.loadCardImage(currentUser, verificationId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.contentType()))
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + image.fileName() + "\"")
                .body(image.content());
    }
}
