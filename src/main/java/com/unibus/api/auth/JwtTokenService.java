package com.unibus.api.auth;

import com.unibus.api.common.ApiException;
import com.unibus.api.user.model.User;
import com.unibus.api.user.model.UserRole;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Component
public class JwtTokenService {
   private static final String HEADER = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
   private final ObjectMapper objectMapper;
   private final byte[] key;
   private final long accessMinutes;
   private final long refreshDays;

   public JwtTokenService(ObjectMapper objectMapper, @Value("${app.jwt.secret}") String secret, @Value("${app.jwt.access-token-minutes}") long accessMinutes, @Value("${app.jwt.refresh-token-days}") long refreshDays) {
      if (secret.length() < 32) {
         throw new IllegalArgumentException("JWT_SECRET must contain at least 32 characters");
      } else {
         this.objectMapper = objectMapper;
         this.key = secret.getBytes(StandardCharsets.UTF_8);
         this.accessMinutes = accessMinutes;
         this.refreshDays = refreshDays;
      }
   }

   public IssuedToken issueAccessToken(User user, Long sessionId) {
      return this.issue(user, sessionId, "access", OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(this.accessMinutes));
   }

   public IssuedToken issueRefreshToken(User user, Long sessionId) {
      return this.issue(user, sessionId, "refresh", OffsetDateTime.now(ZoneOffset.UTC).plusDays(this.refreshDays));
   }

   public TokenClaims parseAccessToken(String token) {
      return this.parse(token, "access");
   }

   public TokenClaims parseRefreshToken(String token) {
      return this.parse(token, "refresh");
   }

   private IssuedToken issue(User user, Long sessionId, String type, OffsetDateTime expiration) {
      try {
         Map<String, Object> payload = new LinkedHashMap();
         payload.put("sub", user.getId());
         payload.put("email", user.getEmail());
         payload.put("role", user.getRole().name());
         payload.put("sid", sessionId);
         payload.put("typ", type);
         payload.put("iat", OffsetDateTime.now(ZoneOffset.UTC).toEpochSecond());
         payload.put("exp", expiration.toEpochSecond());
         String var10000 = this.encode("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");
         String unsigned = var10000 + "." + this.encode(this.objectMapper.writeValueAsString(payload));
         return new IssuedToken(unsigned + "." + this.sign(unsigned), expiration);
      } catch (Exception exception) {
         throw new IllegalStateException("Unable to issue token", exception);
      }
   }

   private TokenClaims parse(String token, String expectedType) {
      try {
         String[] parts = token.split("\\.");
         if (parts.length == 3 && MessageDigest.isEqual(this.sign(parts[0] + "." + parts[1]).getBytes(StandardCharsets.UTF_8), parts[2].getBytes(StandardCharsets.UTF_8))) {
            Map<String, Object> payload = (Map)this.objectMapper.readValue(Base64.getUrlDecoder().decode(parts[1]), new TypeReference<Map<String, Object>>() {
            });
            String type = (String)payload.get("typ");
            long exp = ((Number)payload.get("exp")).longValue();
            if (expectedType.equals(type) && exp > OffsetDateTime.now(ZoneOffset.UTC).toEpochSecond()) {
               return new TokenClaims(((Number)payload.get("sub")).intValue(), ((Number)payload.get("sid")).longValue(), UserRole.valueOf((String)payload.get("role")), type, OffsetDateTime.ofInstant(Instant.ofEpochSecond(exp), ZoneOffset.UTC));
            } else {
               throw this.invalidToken();
            }
         } else {
            throw this.invalidToken();
         }
      } catch (ApiException exception) {
         throw exception;
      } catch (Exception var9) {
         throw this.invalidToken();
      }
   }

   private String encode(String value) {
      return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
   }

   private String sign(String input) {
      try {
         Mac mac = Mac.getInstance("HmacSHA256");
         mac.init(new SecretKeySpec(this.key, "HmacSHA256"));
         return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(input.getBytes(StandardCharsets.UTF_8)));
      } catch (Exception exception) {
         throw new IllegalStateException("Unable to sign token", exception);
      }
   }

   private ApiException invalidToken() {
      return new ApiException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
   }

   public static record IssuedToken(String value, OffsetDateTime expiresAt) {
   }

   public static record TokenClaims(Integer userId, Long sessionId, UserRole role, String type, OffsetDateTime expiresAt) {
   }
}
