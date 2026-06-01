package com.unibus.api.student;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.unibus.api.student.model.StudentVerification;
import com.unibus.api.student.model.StudentVerificationStatus;

public interface StudentVerificationRepository extends JpaRepository<StudentVerification, Long> {

    @EntityGraph(attributePaths = {"user", "reviewer"})
    Optional<StudentVerification> findFirstByUserIdAndCurrentTrueOrderBySubmittedAtDesc(Integer userId);

    @EntityGraph(attributePaths = {"user", "reviewer"})
    Optional<StudentVerification> findFirstByStudentCodeAndCurrentTrueOrderBySubmittedAtDesc(String studentCode);

    @EntityGraph(attributePaths = {"user", "reviewer"})
    List<StudentVerification> findAllByStatusOrderBySubmittedAtAsc(StudentVerificationStatus status);

    @EntityGraph(attributePaths = {"user", "reviewer"})
    List<StudentVerification> findAllByOrderBySubmittedAtDesc();
}
