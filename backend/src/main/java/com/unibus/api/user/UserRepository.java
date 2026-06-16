package com.unibus.api.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.unibus.api.user.model.User;
import com.unibus.api.user.model.UserRole;

public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findFirstByRoleOrderByIdAsc(UserRole role);

    boolean existsByEmailIgnoreCase(String email);
}
