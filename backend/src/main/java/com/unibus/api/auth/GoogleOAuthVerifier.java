package com.unibus.api.auth;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.unibus.api.common.ApiException;

@Component
public class GoogleOAuthVerifier {

    private final RestClient restClient;
    private final String expectedAudience;

    public GoogleOAuthVerifier(@Value("${app.google.client-id:}") String expectedAudience) {
        this.restClient = RestClient.create();
        this.expectedAudience = expectedAudience == null ? "" : expectedAudience.trim();
    }

    public GoogleAccount verify(String idToken, String accessToken) {
        if (expectedAudience.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Google OAuth is not configured");
        }
        if (idToken != null && !idToken.isBlank()) {
            return verifyIdToken(idToken);
        }
        if (accessToken != null && !accessToken.isBlank()) {
            return verifyAccessToken(accessToken);
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "Google credential is required");
    }

    private GoogleAccount verifyIdToken(String idToken) {
        Map<?, ?> tokenInfo;
        try {
            tokenInfo = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .host("oauth2.googleapis.com")
                            .path("/tokeninfo")
                            .queryParam("id_token", idToken)
                            .build())
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientException exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Google token is invalid");
        }

        if (tokenInfo == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Google token is invalid");
        }
        String audience = stringValue(tokenInfo.get("aud"));
        if (!expectedAudience.equals(audience)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Google token audience is not allowed");
        }
        String providerUserId = stringValue(tokenInfo.get("sub"));
        String email = stringValue(tokenInfo.get("email"));
        if (providerUserId.isBlank() || email.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Google token does not contain account identity");
        }

        return new GoogleAccount(
                providerUserId,
                email,
                Boolean.parseBoolean(stringValue(tokenInfo.get("email_verified"))),
                stringValue(tokenInfo.get("name")),
                stringValue(tokenInfo.get("picture")));
    }

    private GoogleAccount verifyAccessToken(String accessToken) {
        Map<?, ?> tokenInfo;
        try {
            tokenInfo = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .host("oauth2.googleapis.com")
                            .path("/tokeninfo")
                            .queryParam("access_token", accessToken)
                            .build())
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientException exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Google token is invalid");
        }

        if (tokenInfo == null || !expectedAudience.equals(stringValue(tokenInfo.get("aud")))) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Google token audience is not allowed");
        }

        Map<?, ?> userInfo;
        try {
            userInfo = restClient.get()
                    .uri("https://www.googleapis.com/oauth2/v3/userinfo")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientException exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Google token is invalid");
        }
        if (userInfo == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Google token is invalid");
        }

        String providerUserId = stringValue(userInfo.get("sub"));
        String email = stringValue(userInfo.get("email"));
        if (providerUserId.isBlank() || email.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Google token does not contain account identity");
        }

        return new GoogleAccount(
                providerUserId,
                email,
                booleanValue(userInfo.get("email_verified")),
                stringValue(userInfo.get("name")),
                stringValue(userInfo.get("picture")));
    }

    private String stringValue(Object value) {
        return value == null ? "" : value.toString();
    }

    private boolean booleanValue(Object value) {
        return value instanceof Boolean bool ? bool : Boolean.parseBoolean(stringValue(value));
    }

    public record GoogleAccount(
            String providerUserId,
            String email,
            boolean emailVerified,
            String fullName,
            String avatarUrl) {
    }
}
