package com.unibus.api.student;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.core.io.FileSystemResource;
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

@RestController
@RequestMapping("/api/v1/student-verifications")
@PreAuthorize("hasAnyRole('STUDENT','ADMIN')")
public class StudentVerificationFileController {

    private final StudentVerificationService studentVerificationService;

    public StudentVerificationFileController(StudentVerificationService studentVerificationService) {
        this.studentVerificationService = studentVerificationService;
    }

    @GetMapping("/{verificationId}/card-image")
    ResponseEntity<FileSystemResource> getCardImage(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Long verificationId) throws IOException {
        Path image = studentVerificationService.loadCardImage(currentUser, verificationId);
        String contentType = Files.probeContentType(image);
        MediaType mediaType = contentType == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(contentType);

        return ResponseEntity.ok()
                .contentType(mediaType)
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + image.getFileName() + "\"")
                .body(new FileSystemResource(image));
    }
}
