package com.retail.inventory.order.service;

import com.retail.inventory.admin.entity.AuditLog;
import com.retail.inventory.admin.repository.AuditLogRepository;
import com.retail.inventory.common.exception.ResourceNotFoundException;
import com.retail.inventory.common.exception.ValidationException;
import com.retail.inventory.inventory.entity.Inventory;
import com.retail.inventory.inventory.entity.InventoryTransaction;
import com.retail.inventory.inventory.entity.InventoryTransactionType;
import com.retail.inventory.inventory.repository.InventoryRepository;
import com.retail.inventory.inventory.repository.InventoryTransactionRepository;
import com.retail.inventory.order.dto.DispatchOrderRequest;
import com.retail.inventory.order.dto.OrderDto;
import com.retail.inventory.order.entity.Order;
import com.retail.inventory.order.entity.OrderItem;
import com.retail.inventory.order.entity.OrderStatus;
import com.retail.inventory.order.entity.Shipment;
import com.retail.inventory.order.repository.OrderRepository;
import com.retail.inventory.order.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FulfillmentService {

    private final OrderRepository orderRepository;
    private final ShipmentRepository shipmentRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final AuditLogRepository auditLogRepository;
    private final OrderService orderService;
    private final com.retail.inventory.notification.service.NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<OrderDto> getFulfillmentQueue(Long warehouseId) {
        List<OrderStatus> queueStatuses = Arrays.asList(
                OrderStatus.CONFIRMED,
                OrderStatus.PROCESSING,
                OrderStatus.PACKED
        );

        List<Order> orders = orderRepository.findByStatusInOrderByCreatedAtAsc(queueStatuses);

        if (warehouseId != null) {
            orders = orders.stream()
                    .filter(order -> order.getWarehouse().getId().equals(warehouseId))
                    .collect(Collectors.toList());
        }

        return orders.stream()
                .map(orderService::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderDto updateOrderStatus(Long orderId, OrderStatus newStatus, String username) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        OrderStatus currentStatus = order.getStatus();

        if (newStatus == OrderStatus.SHIPPED) {
            throw new ValidationException("Orders cannot be marked SHIPPED directly. Use the dispatch endpoint with carrier details.");
        }

        if (newStatus == OrderStatus.DELIVERED) {
            return markDelivered(orderId, username);
        }

        // Validate state transitions
        if (newStatus == OrderStatus.PROCESSING) {
            if (currentStatus != OrderStatus.CONFIRMED) {
                throw new ValidationException("Can only start processing orders that are in CONFIRMED status. Current: " + currentStatus);
            }
        } else if (newStatus == OrderStatus.PACKED) {
            if (currentStatus != OrderStatus.PROCESSING) {
                throw new ValidationException("Can only mark orders PACKED when they are in PROCESSING status. Current: " + currentStatus);
            }
        } else {
            throw new ValidationException("Unsupported status transition to: " + newStatus);
        }

        order.setStatus(newStatus);
        Order updated = orderRepository.save(order);

        auditLogRepository.save(AuditLog.builder()
                .action("ORDER_STATUS_UPDATE")
                .entityName("Order")
                .entityId(updated.getId().toString())
                .performedBy(username != null ? username : "SYSTEM")
                .details("Updated status of order " + updated.getOrderNumber() + " from " + currentStatus + " to " + newStatus)
                .timestamp(Instant.now())
                .build());

        log.info("Order {} status updated to {} by user {}", updated.getOrderNumber(), newStatus, username);
        return orderService.mapToDto(updated);
    }

    @Transactional
    public OrderDto dispatchOrder(Long orderId, DispatchOrderRequest request, String username) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (order.getStatus() != OrderStatus.PACKED) {
            throw new ValidationException("Only PACKED orders can be dispatched/shipped. Current status: " + order.getStatus());
        }

        Long warehouseId = order.getWarehouse().getId();

        // Sort items by productId to enforce deterministic locking order and prevent deadlocks
        List<OrderItem> sortedItems = order.getItems().stream()
                .sorted(Comparator.comparing(item -> item.getProduct().getId()))
                .collect(Collectors.toList());

        // Deduct physical and reserved stock from warehouse inventory
        for (OrderItem item : sortedItems) {
            Long productId = item.getProduct().getId();
            Inventory inventory = inventoryRepository.findForUpdate(productId, warehouseId)
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory position not found for product: " + item.getProduct().getName()));

            int qty = item.getQuantity();
            int newTotal = Math.max(0, inventory.getTotalQuantity() - qty);
            int newReserved = Math.max(0, inventory.getReservedQuantity() - qty);

            inventory.setTotalQuantity(newTotal);
            inventory.setReservedQuantity(newReserved);
            inventoryRepository.save(inventory);

            // Log FULFILLMENT ledger transaction
            InventoryTransaction tx = InventoryTransaction.builder()
                    .product(item.getProduct())
                    .warehouse(order.getWarehouse())
                    .quantityDelta(-qty)
                    .transactionType(InventoryTransactionType.FULFILLMENT)
                    .referenceId(order.getOrderNumber())
                    .performedBy(username != null ? username : "SYSTEM")
                    .reason("Dispatched outbound fulfillment for Order " + order.getOrderNumber())
                    .timestamp(Instant.now())
                    .build();

            transactionRepository.save(tx);
        }

        // Create or update Shipment
        Shipment shipment = order.getShipment();
        if (shipment == null) {
            shipment = Shipment.builder()
                    .order(order)
                    .carrier(request.getCarrier().trim())
                    .trackingNumber(request.getTrackingNumber().trim())
                    .shippedAt(Instant.now())
                    .build();
        } else {
            shipment.setCarrier(request.getCarrier().trim());
            shipment.setTrackingNumber(request.getTrackingNumber().trim());
            shipment.setShippedAt(Instant.now());
        }

        shipmentRepository.save(shipment);
        order.setShipment(shipment);
        order.setStatus(OrderStatus.SHIPPED);

        Order updated = orderRepository.save(order);

        auditLogRepository.save(AuditLog.builder()
                .action("DISPATCH_ORDER")
                .entityName("Order")
                .entityId(updated.getId().toString())
                .performedBy(username != null ? username : "SYSTEM")
                .details("Dispatched order " + updated.getOrderNumber() + " via " + request.getCarrier() + " (Tracking: " + request.getTrackingNumber() + ")")
                .timestamp(Instant.now())
                .build());

        try {
            notificationService.createNotification(
                    com.retail.inventory.notification.entity.NotificationType.SYSTEM_ALERT,
                    "Order Dispatched",
                    "Order " + updated.getOrderNumber() + " has been shipped via " + request.getCarrier() + " (Tracking: " + request.getTrackingNumber() + ")",
                    updated.getOrderNumber()
            );
        } catch (Exception ex) {
            log.warn("Failed to create notification for dispatch order {}: {}", updated.getOrderNumber(), ex.getMessage());
        }

        log.info("Order {} dispatched with tracking {} by user {}", updated.getOrderNumber(), request.getTrackingNumber(), username);
        return orderService.mapToDto(updated);
    }

    @Transactional
    public OrderDto markDelivered(Long orderId, String username) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (order.getStatus() != OrderStatus.SHIPPED) {
            throw new ValidationException("Only SHIPPED orders can be marked as DELIVERED. Current status: " + order.getStatus());
        }

        Shipment shipment = order.getShipment();
        if (shipment != null) {
            shipment.setDeliveredAt(Instant.now());
            shipmentRepository.save(shipment);
        }

        order.setStatus(OrderStatus.DELIVERED);
        Order updated = orderRepository.save(order);

        auditLogRepository.save(AuditLog.builder()
                .action("ORDER_DELIVERED")
                .entityName("Order")
                .entityId(updated.getId().toString())
                .performedBy(username != null ? username : "SYSTEM")
                .details("Customer receipt confirmed for order " + updated.getOrderNumber())
                .timestamp(Instant.now())
                .build());

        log.info("Order {} marked as DELIVERED by user {}", updated.getOrderNumber(), username);
        return orderService.mapToDto(updated);
    }
}
