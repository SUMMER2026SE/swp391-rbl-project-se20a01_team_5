package com.unibus.api.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.unibus.api.user.model.Student;

public interface StudentRepository extends JpaRepository<Student, String> {

    Optional<Student> findByUserId(Integer userId);
}
