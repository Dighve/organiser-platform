package com.organiser.platform.dto;

import lombok.Data;

@Data
public class WebPushSubscriptionRequest {

    private String endpoint;

    private String p256dhKey;

    private String authKey;

    private Keys keys;

    @Data
    public static class Keys {
        private String p256dh;
        private String auth;
    }

    public String resolveP256dhKey() {
        if (p256dhKey != null && !p256dhKey.isBlank()) {
            return p256dhKey;
        }
        return keys != null ? keys.getP256dh() : null;
    }

    public String resolveAuthKey() {
        if (authKey != null && !authKey.isBlank()) {
            return authKey;
        }
        return keys != null ? keys.getAuth() : null;
    }
}
