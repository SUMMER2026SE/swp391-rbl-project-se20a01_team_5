package com.unibus.api.auth;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.unibus.api.auth.model.AuthProvider;
import com.unibus.api.auth.model.UserAuthProvider;

public interface UserAuthProviderRepository extends JpaRepository<UserAuthProvider, Long> {

    Optional<UserAuthProvider> findByProviderAndProviderUserId(AuthProvider provider, String providerUserId);

    Optional<UserAuthProvider> findByUserIdAndProvider(Integer userId, AuthProvider provider);
}
