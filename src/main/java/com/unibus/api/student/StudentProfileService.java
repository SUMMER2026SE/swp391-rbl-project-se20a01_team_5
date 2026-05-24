package com.unibus.api.student;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.student.dto.StudentDtos.Profile;
import com.unibus.api.student.dto.StudentDtos.UpdateProfileRequest;
import com.unibus.api.user.StudentRepository;
import com.unibus.api.user.UserRepository;
import com.unibus.api.user.model.Student;

@Service
public class StudentProfileService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    public StudentProfileService(StudentRepository studentRepository, UserRepository userRepository) {
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Profile getProfile(CurrentUser currentUser) {
        return toProfile(findStudent(currentUser));
    }

    @Transactional
    public Profile updateProfile(CurrentUser currentUser, UpdateProfileRequest request) {
        Student student = findStudent(currentUser);
        String email = nullableTrim(request.email());
        if (email != null && !email.equalsIgnoreCase(student.getUser().getEmail())) {
            if (userRepository.existsByEmailIgnoreCase(email)) {
                throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
            }
            student.getUser().setEmail(email.toLowerCase());
        }
        if (nullableTrim(request.fullName()) != null) {
            student.getUser().setFullName(request.fullName().trim());
        }
        if (request.phoneNumber() != null) {
            student.getUser().setPhoneNumber(nullableTrim(request.phoneNumber()));
        }
        if (request.address() != null) {
            student.getUser().setAddress(nullableTrim(request.address()));
        }
        if (request.avatarUrl() != null) {
            student.getUser().setAvatarUrl(nullableTrim(request.avatarUrl()));
        }
        student.getUser().setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        if (nullableTrim(request.university()) != null) {
            student.setUniversity(request.university().trim());
        }
        if (request.faculty() != null) {
            student.setFaculty(nullableTrim(request.faculty()));
        }
        if (request.academicYear() != null) {
            student.setAcademicYear(request.academicYear());
        }
        if (request.dateOfBirth() != null) {
            student.setDateOfBirth(request.dateOfBirth());
        }
        userRepository.save(student.getUser());
        studentRepository.save(student);
        return toProfile(student);
    }

    private Student findStudent(CurrentUser currentUser) {
        return studentRepository.findByUserId(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile not found"));
    }

    private Profile toProfile(Student student) {
        return new Profile(
                student.getUser().getId(),
                student.getStudentCode(),
                student.getUser().getEmail(),
                student.getUser().getFullName(),
                student.getUser().getPhoneNumber(),
                student.getUser().getAddress(),
                student.getUser().getAvatarUrl(),
                student.getUniversity(),
                student.getFaculty(),
                student.getAcademicYear(),
                student.getDateOfBirth());
    }

    private String nullableTrim(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
