package com.retail.inventory.notification.dto;

import com.retail.inventory.notification.entity.NotificationType;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDto {
    private Long id;
    private NotificationType type;
    private String title;
    private String message;
    private String referenceId;
    private boolean isRead;
    private Instant createdAt;
}
