package com.retail.inventory.order.dto;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipmentDto {
    private Long id;
    private String carrier;
    private String trackingNumber;
    private Instant shippedAt;
    private Instant deliveredAt;
}
