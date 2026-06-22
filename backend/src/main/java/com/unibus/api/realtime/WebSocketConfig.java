package com.unibus.api.realtime;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.unibus.api.auth.JwtTokenService;
import com.unibus.api.user.model.UserRole;

/**
 * STOMP-over-WebSocket configuration for realtime GPS broadcast and in-app chat.
 *
 * <p>Endpoints:
 * <ul>
 *   <li>{@code /ws/stomp} - SockJS-compatible handshake endpoint</li>
 * </ul>
 *
 * <p>Topics (server → client):
 * <ul>
 *   <li>{@code /topic/trips/{tripId}/location} - per-trip GPS update (REQ-STU-005)</li>
 *   <li>{@code /topic/routes/{routeId}/fleet} - per-route live fleet (REQ-CRD-005)</li>
 *   <li>{@code /topic/notifications/{userId}} - per-user notification push</li>
 *   <li>{@code /queue/messages/{userId}} - per-user internal message push (REQ-DRV-006)</li>
 * </ul>
 *
 * <p>Authentication: client must pass the access token via {@code Authorization: Bearer ...}
 * header or via the {@code token} query param on the handshake URL. The interceptor
 * validates the JWT and sets the STOMP user principal so that downstream code can
 * use {@code @SendToUser} for targeted delivery.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenService jwtTokenService;
    private final List<String> allowedOrigins;

    public WebSocketConfig(
            JwtTokenService jwtTokenService,
            @Value("${app.realtime.allowed-origins:http://localhost:3000,http://127.0.0.1:3000}") List<String> allowedOrigins) {
        this.jwtTokenService = jwtTokenService;
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Topic prefix for broadcast (one-to-many) channels.
        registry.enableSimpleBroker("/topic", "/queue");
        // App prefix for client → server messages (e.g., /app/driver/{tripId}/location).
        registry.setApplicationDestinationPrefixes("/app");
        // User-specific destination prefix for @SendToUser.
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/stomp")
                .setAllowedOrigins(allowedOrigins.toArray(new String[0]))
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new JwtChannelInterceptor(jwtTokenService));
    }

    /**
     * Validate JWT on CONNECT frame and set the STOMP user principal so we can use
     * {@code @SendToUser} for targeted delivery.
     */
    static class JwtChannelInterceptor implements ChannelInterceptor {

        private final JwtTokenService jwtTokenService;

        JwtChannelInterceptor(JwtTokenService jwtTokenService) {
            this.jwtTokenService = jwtTokenService;
        }

        @Override
        public Message<?> preSend(Message<?> message, MessageChannel channel) {
            StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
            if (accessor == null) {
                return message;
            }
            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                String authHeader = accessor.getFirstNativeHeader("Authorization");
                String token = null;
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    token = authHeader.substring(7);
                } else {
                    token = accessor.getFirstNativeHeader("token");
                }
                if (token == null || token.isBlank()) {
                    throw new IllegalArgumentException("Missing JWT token in STOMP CONNECT");
                }
                JwtTokenService.TokenClaims claims = jwtTokenService.parseAccessToken(token);
                accessor.setUser(new StompPrincipal(claims.userId().longValue(), claims.role()));
            }
            return message;
        }
    }

    /**
     * Simple principal carrying the user id and role for downstream use.
     */
    record StompPrincipal(Long userId, UserRole role) implements java.security.Principal {
        @Override
        public String getName() {
            return String.valueOf(userId);
        }
    }
}
