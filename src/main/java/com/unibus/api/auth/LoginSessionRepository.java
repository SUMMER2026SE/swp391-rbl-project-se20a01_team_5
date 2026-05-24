package com.unibus.api.auth;

import com.unibus.api.auth.model.LoginSession;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginSessionRepository extends JpaRepository<LoginSession, Long> {
   @EntityGraph(
      attributePaths = {"user"}
   )
   Optional<LoginSession> findByIdAndActiveTrue(Long id);

   List<LoginSession> findAllByUserIdAndActiveTrue(Integer userId);
}
