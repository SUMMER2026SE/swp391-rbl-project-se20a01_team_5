package com.unibus.api.realtime;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Publishes realtime GPS and notification updates to STOMP topics.
 *
 * <p>Topics:
 * <ul>
 *   <li>{@code /topic/trips/{tripId}/location} - per-trip GPS update</li>
 *   <li>{@code /topic/routes/{routeId}/fleet} - aggregated live fleet for a route</li>
 *   <li>{@code /user/queue/notifications} - per-user notification push (via @SendToUser)</li>
 *   <li>{@code /user/queue/messages} - per-user internal message push</li>
 * </ul>
 */
@Service
public class RealtimePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public RealtimePublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishTripLocation(Integer tripId, Integer routeId, double longitude, double latitude,
            Double speedKmh, Integer occupancy) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("tripId", tripId);
        payload.put("routeId", routeId);
        payload.put("longitude", longitude);
        payload.put("latitude", latitude);
        payload.put("speedKmh", speedKmh);
        payload.put("occupancy", occupancy);
        payload.put("timestamp", Instant.now().toString());
        messagingTemplate.convertAndSend("/topic/trips/" + tripId + "/location", (Object) payload);
        if (routeId != null) {
            messagingTemplate.convertAndSend("/topic/routes/" + routeId + "/fleet", (Object) payload);
        }
    }

    public void pushNotification(Long userId, String title, String body, String type) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", title);
        payload.put("body", body);
        payload.put("type", type);
        payload.put("timestamp", Instant.now().toString());
        messagingTemplate.convertAndSendToUser(String.valueOf(userId), "/queue/notifications", (Object) payload);
    }

    public void pushInternalMessage(Long recipientUserId, Long messageId, Integer senderUserId,
            String senderName, String body) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("messageId", messageId);
        payload.put("senderUserId", senderUserId);
        payload.put("senderName", senderName);
        payload.put("body", body);
        payload.put("timestamp", Instant.now().toString());
        messagingTemplate.convertAndSendToUser(String.valueOf(recipientUserId), "/queue/messages", (Object) payload);
    }
}
