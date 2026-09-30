package com.retail.inventory.order.dto;

import com.retail.inventory.order.entity.OrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDto {
    private Long id;
    private String orderNumber;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String customerAddress;
    private Long warehouseId;
    private String warehouseName;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private String notes;
    private List<OrderItemDto> items;
    private ShipmentDto shipment;
    private Instant createdAt;
    private Instant updatedAt;
}
