package com.unibus.api.security;

import com.unibus.api.user.model.UserRole;

public record CurrentUser(Integer userId, String email, UserRole role, Long sessionId) {
}
