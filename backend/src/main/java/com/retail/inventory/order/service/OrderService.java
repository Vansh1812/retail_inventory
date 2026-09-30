package com.retail.inventory.order.service;

import com.retail.inventory.admin.entity.AuditLog;
import com.retail.inventory.admin.repository.AuditLogRepository;
import com.retail.inventory.catalog.entity.Product;
import com.retail.inventory.catalog.repository.ProductRepository;
import com.retail.inventory.common.exception.InsufficientStockException;
import com.retail.inventory.common.exception.ResourceNotFoundException;
import com.retail.inventory.common.exception.ValidationException;
import com.retail.inventory.inventory.entity.Inventory;
import com.retail.inventory.inventory.entity.InventoryTransaction;
import com.retail.inventory.inventory.entity.InventoryTransactionType;
import com.retail.inventory.inventory.repository.InventoryRepository;
import com.retail.inventory.inventory.repository.InventoryTransactionRepository;
import com.retail.inventory.order.dto.*;
import com.retail.inventory.order.entity.Customer;
import com.retail.inventory.order.entity.Order;
import com.retail.inventory.order.entity.OrderItem;
import com.retail.inventory.order.entity.OrderStatus;
import com.retail.inventory.order.repository.CustomerRepository;
import com.retail.inventory.order.repository.OrderRepository;
import com.retail.inventory.warehouse.entity.Warehouse;
import com.retail.inventory.warehouse.entity.WarehouseStatus;
import com.retail.inventory.warehouse.repository.WarehouseRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final AuditLogRepository auditLogRepository;
    private final com.retail.inventory.notification.service.NotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<OrderDto> getOrders(
            OrderStatus status,
            Long warehouseId,
            Long customerId,
            String search,
            Pageable pageable
    ) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim().toLowerCase() : null;

        Specification<Order> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (warehouseId != null) {
                predicates.add(cb.equal(root.get("warehouse").get("id"), warehouseId));
            }
            if (customerId != null) {
                predicates.add(cb.equal(root.get("customer").get("id"), customerId));
            }
            if (cleanSearch != null) {
                String pattern = "%" + cleanSearch + "%";
                Predicate orderNumLike = cb.like(cb.lower(root.get("orderNumber")), pattern);
                Predicate custNameLike = cb.like(cb.lower(root.get("customer").get("name")), pattern);
                predicates.add(cb.or(orderNumLike, custNameLike));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return orderRepository.findAll(spec, pageable).map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderById(Long id) {
        return orderRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    @Transactional
    public OrderDto createOrder(CreateOrderRequest request, String username) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with id: " + request.getWarehouseId()));

        if (warehouse.getStatus() == WarehouseStatus.INACTIVE) {
            throw new ValidationException("Cannot assign order to an INACTIVE warehouse: " + warehouse.getName());
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new ValidationException("Order must contain at least one line item");
        }

        String orderNumber = generateOrderNumber();
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .customer(customer)
                .warehouse(warehouse)
                .status(OrderStatus.PENDING)
                .notes(request.getNotes())
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CreateOrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemReq.getProductId()));

            BigDecimal unitPrice = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : product.getSellingPrice();
            if (unitPrice == null || unitPrice.compareTo(BigDecimal.ZERO) <= 0) {
                throw new ValidationException("Unit price must be greater than zero for product: " + product.getName());
            }

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .build();

            order.addItem(orderItem);
            totalAmount = totalAmount.add(orderItem.getSubtotal());
        }

        order.setTotalAmount(totalAmount);
        Order saved = orderRepository.save(order);

        auditLogRepository.save(AuditLog.builder()
                .action("CREATE_ORDER")
                .entityName("Order")
                .entityId(saved.getId().toString())
                .performedBy(username != null ? username : "SYSTEM")
                .details("Created order " + saved.getOrderNumber() + " with " + saved.getItems().size() + " items, total: $" + saved.getTotalAmount())
                .timestamp(Instant.now())
                .build());

        try {
            notificationService.createNotification(
                    com.retail.inventory.notification.entity.NotificationType.NEW_ORDER,
                    "New Order Created",
                    "Order " + saved.getOrderNumber() + " placed by " + saved.getCustomer().getName() + " for $" + saved.getTotalAmount(),
                    saved.getOrderNumber()
            );
        } catch (Exception ex) {
            log.warn("Failed to create notification for order {}: {}", saved.getOrderNumber(), ex.getMessage());
        }

        log.info("Order created successfully: {} (ID: {}) by user {}", saved.getOrderNumber(), saved.getId(), username);
        return mapToDto(saved);
    }

    @Transactional
    public OrderDto confirmOrder(Long orderId, String username) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new ValidationException("Only PENDING orders can be confirmed. Current status: " + order.getStatus());
        }

        Long warehouseId = order.getWarehouse().getId();

        // 1. Sort items by productId to enforce deterministic locking order and prevent deadlocks
        List<OrderItem> sortedItems = order.getItems().stream()
                .sorted(Comparator.comparing(item -> item.getProduct().getId()))
                .collect(Collectors.toList());

        // 2. Validate available stock under pessimistic write locks
        for (OrderItem item : sortedItems) {
            Long productId = item.getProduct().getId();
            Inventory inventory = inventoryRepository.findForUpdate(productId, warehouseId)
                    .orElseThrow(() -> new InsufficientStockException(
                            "Insufficient stock for SKU: " + item.getProduct().getSku() +
                            " in warehouse " + order.getWarehouse().getName() + ". Required: " + item.getQuantity() + ", Available: 0"
                    ));

            if (inventory.getAvailableQuantity() < item.getQuantity()) {
                throw new InsufficientStockException(
                        "Insufficient stock for SKU: " + item.getProduct().getSku() +
                        " in warehouse " + order.getWarehouse().getName() +
                        ". Required: " + item.getQuantity() +
                        ", Available: " + inventory.getAvailableQuantity()
                );
            }
        }

        // 3. Atomically reserve stock and post RESERVATION audit ledger entries
        for (OrderItem item : sortedItems) {
            Long productId = item.getProduct().getId();
            Inventory inventory = inventoryRepository.findForUpdate(productId, warehouseId)
                    .orElseThrow(() -> new InsufficientStockException("Inventory not found for SKU: " + item.getProduct().getSku()));

            inventory.setReservedQuantity(inventory.getReservedQuantity() + item.getQuantity());
            inventoryRepository.save(inventory);

            InventoryTransaction tx = InventoryTransaction.builder()
                    .product(item.getProduct())
                    .warehouse(order.getWarehouse())
                    .quantityDelta(-item.getQuantity())
                    .transactionType(InventoryTransactionType.RESERVATION)
                    .referenceId(order.getOrderNumber())
                    .performedBy(username != null ? username : "SYSTEM")
                    .reason("Stock reservation for Order " + order.getOrderNumber())
                    .timestamp(Instant.now())
                    .build();

            transactionRepository.save(tx);
        }

        // 4. Advance status to CONFIRMED
        order.setStatus(OrderStatus.CONFIRMED);
        Order updated = orderRepository.save(order);

        auditLogRepository.save(AuditLog.builder()
                .action("CONFIRM_ORDER")
                .entityName("Order")
                .entityId(updated.getId().toString())
                .performedBy(username != null ? username : "SYSTEM")
                .details("Confirmed order " + updated.getOrderNumber() + " and reserved stock for all line items")
                .timestamp(Instant.now())
                .build());

        try {
            notificationService.createNotification(
                    com.retail.inventory.notification.entity.NotificationType.SYSTEM_ALERT,
                    "Order Confirmed & Stock Reserved",
                    "Order " + updated.getOrderNumber() + " confirmed. Stock reserved in " + updated.getWarehouse().getName(),
                    updated.getOrderNumber()
            );
        } catch (Exception ex) {
            log.warn("Failed to create notification for confirm order {}: {}", updated.getOrderNumber(), ex.getMessage());
        }

        log.info("Order confirmed: {} by user {}", updated.getOrderNumber(), username);
        return mapToDto(updated);
    }

    @Transactional
    public OrderDto cancelOrder(Long orderId, String username) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        OrderStatus currentStatus = order.getStatus();
        if (currentStatus != OrderStatus.PENDING && currentStatus != OrderStatus.CONFIRMED && currentStatus != OrderStatus.PROCESSING) {
            throw new ValidationException("Cannot cancel order in status: " + currentStatus + ". Only PENDING, CONFIRMED, or PROCESSING orders can be cancelled.");
        }

        Long warehouseId = order.getWarehouse().getId();

        // If order was CONFIRMED or PROCESSING, release reserved stock
        if (currentStatus == OrderStatus.CONFIRMED || currentStatus == OrderStatus.PROCESSING) {
            List<OrderItem> sortedItems = order.getItems().stream()
                    .sorted(Comparator.comparing(item -> item.getProduct().getId()))
                    .collect(Collectors.toList());

            for (OrderItem item : sortedItems) {
                Long productId = item.getProduct().getId();
                inventoryRepository.findForUpdate(productId, warehouseId).ifPresent(inventory -> {
                    int newReserved = Math.max(0, inventory.getReservedQuantity() - item.getQuantity());
                    inventory.setReservedQuantity(newReserved);
                    inventoryRepository.save(inventory);

                    InventoryTransaction tx = InventoryTransaction.builder()
                            .product(item.getProduct())
                            .warehouse(order.getWarehouse())
                            .quantityDelta(item.getQuantity())
                            .transactionType(InventoryTransactionType.RELEASE_RESERVATION)
                            .referenceId(order.getOrderNumber())
                            .performedBy(username != null ? username : "SYSTEM")
                            .reason("Released reservation for cancelled Order " + order.getOrderNumber())
                            .timestamp(Instant.now())
                            .build();

                    transactionRepository.save(tx);
                });
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order updated = orderRepository.save(order);

        auditLogRepository.save(AuditLog.builder()
                .action("CANCEL_ORDER")
                .entityName("Order")
                .entityId(updated.getId().toString())
                .performedBy(username != null ? username : "SYSTEM")
                .details("Cancelled order " + updated.getOrderNumber() + " (was " + currentStatus + ")")
                .timestamp(Instant.now())
                .build());

        log.info("Order cancelled: {} by user {}", updated.getOrderNumber(), username);
        return mapToDto(updated);
    }

    public OrderDto mapToDto(Order order) {
        if (order == null) return null;

        List<OrderItemDto> itemDtos = order.getItems().stream()
                .map(item -> OrderItemDto.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productSku(item.getProduct().getSku())
                        .productName(item.getProduct().getName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        ShipmentDto shipmentDto = null;
        if (order.getShipment() != null) {
            shipmentDto = ShipmentDto.builder()
                    .id(order.getShipment().getId())
                    .carrier(order.getShipment().getCarrier())
                    .trackingNumber(order.getShipment().getTrackingNumber())
                    .shippedAt(order.getShipment().getShippedAt())
                    .deliveredAt(order.getShipment().getDeliveredAt())
                    .build();
        }

        return OrderDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerId(order.getCustomer().getId())
                .customerName(order.getCustomer().getName())
                .customerEmail(order.getCustomer().getEmail())
                .customerPhone(order.getCustomer().getPhone())
                .customerAddress(order.getCustomer().getAddress())
                .warehouseId(order.getWarehouse().getId())
                .warehouseName(order.getWarehouse().getName())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .notes(order.getNotes())
                .items(itemDtos)
                .shipment(shipmentDto)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private String generateOrderNumber() {
        int year = LocalDate.now().getYear();
        String randomSuffix = UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        return "ORD-" + year + "-" + randomSuffix;
    }
}
