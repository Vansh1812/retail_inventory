package com.retail.inventory.order.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.retail.inventory.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "order_shipments", indexes = {
        @Index(name = "idx_shipments_tracking", columnList = "tracking_number"),
        @Index(name = "idx_shipments_order", columnList = "order_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_shipment_order", columnNames = "order_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shipment extends BaseEntity {

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Column(nullable = false, length = 100)
    private String carrier;

    @Column(name = "tracking_number", nullable = false, length = 100)
    private String trackingNumber;

    @Column(name = "shipped_at")
    private Instant shippedAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;
}
