package com.organiser.platform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.organiser.platform.dto.WebPushSubscriptionRequest;
import com.organiser.platform.model.Member;
import com.organiser.platform.model.WebPushSubscription;
import com.organiser.platform.repository.MemberRepository;
import com.organiser.platform.repository.WebPushSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.security.Security;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebPushService {

    private final WebPushSubscriptionRepository subscriptionRepository;
    private final MemberRepository memberRepository;
    private final ObjectMapper objectMapper;

    @Value("${push-vapid.public:}")
    private String vapidPublicKey;

    @Value("${push-vapid.private:}")
    private String vapidPrivateKey;

    @Value("${push-vapid.subject:mailto:support@outmeets.com}")
    private String vapidSubject;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    private PushService pushService;

    @PostConstruct
    void init() {
        if (isBlank(vapidPublicKey) || isBlank(vapidPrivateKey)) {
            log.warn("Web push disabled: missing PUSH_VAPID_PUBLIC or PUSH_VAPID_PRIVATE");
            return;
        }

        try {
            if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
                Security.addProvider(new BouncyCastleProvider());
            }
            this.pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
            log.info("Web push configured with subject {}", vapidSubject);
        } catch (Exception ex) {
            this.pushService = null;
            log.error("Failed to initialize web push service", ex);
        }
    }

    @Transactional(readOnly = true)
    public String getPublicKey() {
        if (isBlank(vapidPublicKey)) {
            throw new IllegalStateException("Push VAPID public key is not configured");
        }
        return vapidPublicKey;
    }

    @Transactional
    public void upsertSubscription(Long memberId, WebPushSubscriptionRequest request) {
        Member member = memberRepository.findById(memberId)
            .orElseThrow(() -> new RuntimeException("Member not found"));

        String endpoint = request.getEndpoint() != null ? request.getEndpoint().trim() : null;
        String p256dhKey = request.resolveP256dhKey() != null ? request.resolveP256dhKey().trim() : null;
        String authKey = request.resolveAuthKey() != null ? request.resolveAuthKey().trim() : null;

        if (isBlank(endpoint) || isBlank(p256dhKey) || isBlank(authKey)) {
            throw new IllegalArgumentException("Invalid push subscription payload");
        }

        WebPushSubscription subscription = subscriptionRepository.findByEndpoint(endpoint)
            .orElseGet(() -> WebPushSubscription.builder().endpoint(endpoint).build());

        subscription.setMember(member);
        subscription.setP256dhKey(p256dhKey);
        subscription.setAuthKey(authKey);
        subscription.setActive(true);
        subscriptionRepository.save(subscription);
    }

    @Transactional
    public void unsubscribe(Long memberId, String endpoint) {
        Optional<WebPushSubscription> existing = subscriptionRepository.findByMemberIdAndEndpoint(memberId, endpoint);
        existing.ifPresent(subscription -> {
            subscription.setActive(false);
            subscriptionRepository.save(subscription);
        });
    }

    @Transactional
    public void sendToMember(Long memberId, String title, String body, String pathOrUrl) {
        if (pushService == null) {
            return;
        }

        List<WebPushSubscription> subscriptions = subscriptionRepository.findByMemberIdAndActiveTrue(memberId);
        if (subscriptions.isEmpty()) {
            return;
        }

        String payload;
        try {
            Map<String, String> payloadBody = new HashMap<>();
            payloadBody.put("title", title);
            payloadBody.put("body", body);
            payloadBody.put("url", buildTargetUrl(pathOrUrl));
            payload = objectMapper.writeValueAsString(payloadBody);
        } catch (Exception ex) {
            log.error("Failed to build push payload for member {}", memberId, ex);
            return;
        }

        for (WebPushSubscription subscription : subscriptions) {
            try {
                Notification notification = new Notification(
                    subscription.getEndpoint(),
                    subscription.getP256dhKey(),
                    subscription.getAuthKey(),
                    payload
                );
                HttpResponse response = pushService.send(notification);
                Integer statusCode = response != null && response.getStatusLine() != null
                    ? response.getStatusLine().getStatusCode()
                    : null;

                if (statusCode != null && (statusCode == 404 || statusCode == 410)) {
                    subscription.setActive(false);
                    subscriptionRepository.save(subscription);
                    continue;
                }

                subscription.setLastNotifiedAt(LocalDateTime.now());
                subscriptionRepository.save(subscription);
            } catch (Exception ex) {
                if (isSubscriptionGone(ex)) {
                    subscription.setActive(false);
                    subscriptionRepository.save(subscription);
                    log.info("Disabled stale push subscription {}", subscription.getId());
                } else {
                    log.warn("Failed push send for subscription {}", subscription.getId(), ex);
                }
            }
        }
    }

    private String buildTargetUrl(String pathOrUrl) {
        if (isBlank(pathOrUrl)) {
            return frontendUrl;
        }
        if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
            return pathOrUrl;
        }

        String normalizedBase = frontendUrl.endsWith("/")
            ? frontendUrl.substring(0, frontendUrl.length() - 1)
            : frontendUrl;
        String normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : "/" + pathOrUrl;
        return normalizedBase + normalizedPath;
    }

    private boolean isSubscriptionGone(Exception ex) {
        String message = ex.getMessage();
        if (message == null) {
            return false;
        }
        String lower = message.toLowerCase();
        return lower.contains("410") || lower.contains("404") || lower.contains("gone");
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
