package com.unibus.api.auth.dto;

import com.unibus.api.user.model.UserRole;
import java.time.OffsetDateTime;

public final class AuthResponses {
   private AuthResponses() {
   }

   public static record RegisteredUser(Integer userId, String studentCode, String email, UserRole role) {
   }

   public static record TokenPair(String tokenType, String accessToken, OffsetDateTime accessTokenExpiresAt, String refreshToken, OffsetDateTime refreshTokenExpiresAt, UserRole role) {
   }
}
