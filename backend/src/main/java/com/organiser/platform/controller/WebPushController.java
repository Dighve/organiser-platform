package com.organiser.platform.controller;

import com.organiser.platform.dto.PushTestNotificationRequest;
import com.organiser.platform.dto.WebPushSubscriptionRequest;
import com.organiser.platform.service.WebPushService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/push")
@RequiredArgsConstructor
public class WebPushController {

    private final WebPushService webPushService;

    @GetMapping("/vapid-public-key")
    public ResponseEntity<Map<String, String>> getVapidPublicKey() {
        return ResponseEntity.ok(Map.of("publicKey", webPushService.getPublicKey()));
    }

    @PostMapping("/subscribe")
    public ResponseEntity<Void> subscribe(
            @Valid @RequestBody WebPushSubscriptionRequest request,
            Authentication authentication
    ) {
        Long memberId = EventController.getUserIdFromAuth(authentication);
        webPushService.upsertSubscription(memberId, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/subscribe")
    public ResponseEntity<Void> unsubscribe(
            @RequestParam String endpoint,
            Authentication authentication
    ) {
        Long memberId = EventController.getUserIdFromAuth(authentication);
        webPushService.unsubscribe(memberId, endpoint);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/test")
    public ResponseEntity<Void> sendTest(
            @Valid @RequestBody PushTestNotificationRequest request,
            Authentication authentication
    ) {
        Long memberId = EventController.getUserIdFromAuth(authentication);
        webPushService.sendToMember(memberId, request.getTitle(), request.getBody(), request.getUrl());
        return ResponseEntity.ok().build();
    }
}
