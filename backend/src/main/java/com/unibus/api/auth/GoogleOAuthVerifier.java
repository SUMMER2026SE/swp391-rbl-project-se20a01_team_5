package com.unibus.api.auth;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
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

    public GoogleAccount verify(String idToken) {
        if (expectedAudience.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Google OAuth is not configured");
        }

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

    private String stringValue(Object value) {
        return value == null ? "" : value.toString();
    }

    public record GoogleAccount(
            String providerUserId,
            String email,
            boolean emailVerified,
            String fullName,
            String avatarUrl) {
    }
}
