package com.unibus.api.auth;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import com.unibus.api.auth.model.LoginSession;

public interface LoginSessionRepository extends JpaRepository<LoginSession, Long> {

    @EntityGraph(attributePaths = "user")
    Optional<LoginSession> findByIdAndActiveTrue(Long id);

    List<LoginSession> findAllByUserIdAndActiveTrue(Integer userId);
}
