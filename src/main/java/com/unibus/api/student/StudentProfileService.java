package com.unibus.api.student;

import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.student.dto.StudentDtos;
import com.unibus.api.user.StudentRepository;
import com.unibus.api.user.UserRepository;
import com.unibus.api.user.model.Student;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentProfileService {
   private final StudentRepository studentRepository;
   private final UserRepository userRepository;

   public StudentProfileService(StudentRepository studentRepository, UserRepository userRepository) {
      this.studentRepository = studentRepository;
      this.userRepository = userRepository;
   }

   @Transactional(
      readOnly = true
   )
   public StudentDtos.Profile getProfile(CurrentUser currentUser) {
      return this.toProfile(this.findStudent(currentUser));
   }

   @Transactional
   public StudentDtos.Profile updateProfile(CurrentUser currentUser, StudentDtos.UpdateProfileRequest request) {
      Student student = this.findStudent(currentUser);
      String email = this.nullableTrim(request.email());
      if (email != null && !email.equalsIgnoreCase(student.getUser().getEmail())) {
         if (this.userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
         }

         student.getUser().setEmail(email.toLowerCase());
      }

      if (this.nullableTrim(request.fullName()) != null) {
         student.getUser().setFullName(request.fullName().trim());
      }

      if (request.phoneNumber() != null) {
         student.getUser().setPhoneNumber(this.nullableTrim(request.phoneNumber()));
      }

      if (request.address() != null) {
         student.getUser().setAddress(this.nullableTrim(request.address()));
      }

      if (request.avatarUrl() != null) {
         student.getUser().setAvatarUrl(this.nullableTrim(request.avatarUrl()));
      }

      student.getUser().setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
      if (this.nullableTrim(request.university()) != null) {
         student.setUniversity(request.university().trim());
      }

      if (request.faculty() != null) {
         student.setFaculty(this.nullableTrim(request.faculty()));
      }

      if (request.academicYear() != null) {
         student.setAcademicYear(request.academicYear());
      }

      if (request.dateOfBirth() != null) {
         student.setDateOfBirth(request.dateOfBirth());
      }

      this.userRepository.save(student.getUser());
      this.studentRepository.save(student);
      return this.toProfile(student);
   }

   private Student findStudent(CurrentUser currentUser) {
      return (Student)this.studentRepository.findByUserId(currentUser.userId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile not found"));
   }

   private StudentDtos.Profile toProfile(Student student) {
      return new StudentDtos.Profile(student.getUser().getId(), student.getStudentCode(), student.getUser().getEmail(), student.getUser().getFullName(), student.getUser().getPhoneNumber(), student.getUser().getAddress(), student.getUser().getAvatarUrl(), student.getUniversity(), student.getFaculty(), student.getAcademicYear(), student.getDateOfBirth());
   }

   private String nullableTrim(String value) {
      return value != null && !value.isBlank() ? value.trim() : null;
   }
}
