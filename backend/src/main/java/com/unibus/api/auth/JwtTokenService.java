package com.unibus.api.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import com.unibus.api.common.ApiException;
import com.unibus.api.user.model.User;
import com.unibus.api.user.model.UserRole;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Component
public class JwtTokenService {

    private static final String HEADER = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";

    private final ObjectMapper objectMapper;
    private final byte[] key;
    private final long accessMinutes;
    private final long refreshDays;

    public JwtTokenService(
            ObjectMapper objectMapper,
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-minutes}") long accessMinutes,
            @Value("${app.jwt.refresh-token-days}") long refreshDays) {
        if (secret.length() < 32) {
            throw new IllegalArgumentException("JWT_SECRET must contain at least 32 characters");
        }
        this.objectMapper = objectMapper;
        this.key = secret.getBytes(StandardCharsets.UTF_8);
        this.accessMinutes = accessMinutes;
        this.refreshDays = refreshDays;
    }

    public IssuedToken issueAccessToken(User user, Long sessionId) {
        return issue(user, sessionId, "access", OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(accessMinutes));
    }

    public IssuedToken issueRefreshToken(User user, Long sessionId) {
        return issue(user, sessionId, "refresh", OffsetDateTime.now(ZoneOffset.UTC).plusDays(refreshDays));
    }

    public TokenClaims parseAccessToken(String token) {
        return parse(token, "access");
    }

    public TokenClaims parseRefreshToken(String token) {
        return parse(token, "refresh");
    }

    private IssuedToken issue(User user, Long sessionId, String type, OffsetDateTime expiration) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sub", user.getId());
            payload.put("email", user.getEmail());
            payload.put("role", user.getRole().name());
            payload.put("sid", sessionId);
            payload.put("typ", type);
            payload.put("iat", OffsetDateTime.now(ZoneOffset.UTC).toEpochSecond());
            payload.put("exp", expiration.toEpochSecond());
            payload.put("jti", UUID.randomUUID().toString());

            String unsigned = encode(HEADER) + "." + encode(objectMapper.writeValueAsString(payload));
            return new IssuedToken(unsigned + "." + sign(unsigned), expiration);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to issue token", exception);
        }
    }

    private TokenClaims parse(String token, String expectedType) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3 || !MessageDigest.isEqual(
                    sign(parts[0] + "." + parts[1]).getBytes(StandardCharsets.UTF_8),
                    parts[2].getBytes(StandardCharsets.UTF_8))) {
                throw invalidToken();
            }
            Map<String, Object> payload = objectMapper.readValue(
                    Base64.getUrlDecoder().decode(parts[1]), new TypeReference<>() { });
            String type = (String) payload.get("typ");
            long exp = ((Number) payload.get("exp")).longValue();
            if (!expectedType.equals(type) || exp <= OffsetDateTime.now(ZoneOffset.UTC).toEpochSecond()) {
                throw invalidToken();
            }
            return new TokenClaims(
                    ((Number) payload.get("sub")).intValue(),
                    ((Number) payload.get("sid")).longValue(),
                    UserRole.valueOf((String) payload.get("role")),
                    type,
                    OffsetDateTime.ofInstant(java.time.Instant.ofEpochSecond(exp), ZoneOffset.UTC));
        } catch (ApiException exception) {
            throw exception;
        } catch (Exception exception) {
            throw invalidToken();
        }
    }

    private String encode(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private String sign(String input) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(input.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to sign token", exception);
        }
    }

    private ApiException invalidToken() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
    }

    public record IssuedToken(String value, OffsetDateTime expiresAt) {
    }

    public record TokenClaims(Integer userId, Long sessionId, UserRole role, String type, OffsetDateTime expiresAt) {
    }
}
