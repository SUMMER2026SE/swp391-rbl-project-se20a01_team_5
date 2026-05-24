package com.unibus.api.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.unibus.api.user.model.User;

public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}
