package com.unibus.api.student.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

import com.unibus.api.student.model.StudentVerificationStatus;

public final class StudentDtos {
   private StudentDtos() {
   }

   public static record Profile(Integer userId, String studentCode, String email, String fullName, String phoneNumber, String address, String avatarUrl, String university, Integer universityId, String faculty, Integer academicYear, LocalDate dateOfBirth, StudentVerificationStatus studentVerificationStatus, boolean hasPassword) {
   }

   public static record UpdateProfileRequest(@Email @Size(
   max = 100
) String email, @Size(
   max = 100
) String fullName, @Size(
   max = 15
) String phoneNumber, @Size(
   max = 255
) String address, @Size(
   max = 500
) String avatarUrl, @Size(
   max = 150
) String university, @Size(
   max = 100
) String faculty, Integer academicYear, LocalDate dateOfBirth) {
   }
}
