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
import com.unibus.api.user.model.User;

@Service
public class StudentProfileService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final UniversityCatalog universityCatalog;

    public StudentProfileService(
            StudentRepository studentRepository,
            UserRepository userRepository,
            UniversityCatalog universityCatalog) {
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.universityCatalog = universityCatalog;
    }

    @Transactional(readOnly = true)
    public Profile getProfile(CurrentUser currentUser) {
        User user = findUser(currentUser);
        return toProfile(user, studentRepository.findByUserId(currentUser.userId()).orElse(null));
    }

    @Transactional
    public Profile updateProfile(CurrentUser currentUser, UpdateProfileRequest request) {
        User user = findUser(currentUser);
        Student student = studentRepository.findByUserId(currentUser.userId()).orElse(null);
        String email = nullableTrim(request.email());
        if (email != null && !email.equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmailIgnoreCase(email)) {
                throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
            }
            user.setEmail(email.toLowerCase());
        }
        if (nullableTrim(request.fullName()) != null) {
            user.setFullName(request.fullName().trim());
        }
        if (request.phoneNumber() != null) {
            user.setPhoneNumber(nullableTrim(request.phoneNumber()));
        }
        if (request.address() != null) {
            user.setAddress(nullableTrim(request.address()));
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(nullableTrim(request.avatarUrl()));
        }
        user.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        if (student != null && nullableTrim(request.university()) != null) {
            student.setUniversity(universityCatalog.requireAllowed(request.university()));
        }
        if (student != null && request.faculty() != null) {
            student.setFaculty(nullableTrim(request.faculty()));
        }
        if (student != null && request.academicYear() != null) {
            student.setAcademicYear(request.academicYear());
        }
        if (student != null && request.dateOfBirth() != null) {
            student.setDateOfBirth(request.dateOfBirth());
        }
        userRepository.save(user);
        if (student != null) {
            studentRepository.save(student);
        }
        return toProfile(user, student);
    }

    private Student findStudent(CurrentUser currentUser) {
        return studentRepository.findByUserId(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile not found"));
    }

    private User findUser(CurrentUser currentUser) {
        return userRepository.findById(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private Profile toProfile(User user, Student student) {
        return new Profile(
                user.getId(),
                student == null ? null : student.getStudentCode(),
                user.getEmail(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getAddress(),
                user.getAvatarUrl(),
                student == null ? null : student.getUniversity(),
                student == null ? null : student.getFaculty(),
                student == null ? null : student.getAcademicYear(),
                student == null ? null : student.getDateOfBirth(),
                user.getStudentVerificationStatus(),
                user.getPasswordHash() != null && !user.getPasswordHash().isBlank());
    }

    private Profile toProfile(Student student) {
        return toProfile(student.getUser(), student);
    }

    private String nullableTrim(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
