package com.unibus.api.student;

import java.math.BigDecimal;

import org.springframework.web.multipart.MultipartFile;

public interface StudentCardOcrService {

    Result extract(
            MultipartFile cardImage,
            String expectedFullName,
            String expectedStudentCode,
            String expectedUniversity);

    record Result(
            String fullName,
            String studentCode,
            String university,
            String rawText,
            BigDecimal confidenceScore) {
    }
}
