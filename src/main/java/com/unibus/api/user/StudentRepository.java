package com.unibus.api.user;

import com.unibus.api.user.model.Student;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, String> {
   Optional<Student> findByUserId(Integer userId);
}
