package com.retail.inventory.portal.controller;

import com.retail.inventory.auth.security.services.UserDetailsImpl;
import com.retail.inventory.common.dto.ApiResponse;
import com.retail.inventory.common.exception.ResourceNotFoundException;
import com.retail.inventory.common.exception.ValidationException;
import com.retail.inventory.order.dto.CreateOrderItemRequest;
import com.retail.inventory.order.dto.CreateOrderRequest;
import com.retail.inventory.order.dto.OrderDto;
import com.retail.inventory.order.entity.Order;
import com.retail.inventory.order.repository.CustomerRepository;
import com.retail.inventory.order.repository.OrderRepository;
import com.retail.inventory.order.service.OrderService;
import com.retail.inventory.portal.dto.CustomerPlaceOrderRequest;
import com.retail.inventory.warehouse.entity.Warehouse;
import com.retail.inventory.warehouse.entity.WarehouseStatus;
import com.retail.inventory.warehouse.repository.WarehouseRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/portal/customer")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
public class CustomerPortalController {

    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final WarehouseRepository warehouseRepository;

    @GetMapping("/my-orders")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getMyOrders(@AuthenticationPrincipal UserDetailsImpl userPrincipal) {
        Long customerId = resolveCustomerId(userPrincipal);
        if (customerId == null) {
            List<OrderDto> allOrders = orderRepository.findAll().stream()
                    .map(orderService::mapToDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(allOrders, "Customer orders retrieved successfully"));
        }

        List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        List<OrderDto> dtos = orders.stream()
                .map(orderService::mapToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(dtos, "My orders retrieved successfully"));
    }

    @PostMapping("/place-order")
    public ResponseEntity<ApiResponse<OrderDto>> placeOrder(
            @Valid @RequestBody CustomerPlaceOrderRequest request,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        Long customerId = resolveCustomerId(userPrincipal);
        if (customerId == null) {
            throw new ValidationException("Authenticated user has no associated customer account to place orders.");
        }

        Long warehouseId = request.getWarehouseId();
        if (warehouseId == null) {
            warehouseId = warehouseRepository.findAll().stream()
                    .filter(w -> w.getStatus() == WarehouseStatus.ACTIVE)
                    .map(Warehouse::getId)
                    .findFirst()
                    .orElseThrow(() -> new ValidationException("No active fulfillment warehouses available."));
        }

        List<CreateOrderItemRequest> itemRequests = request.getItems().stream()
                .map(item -> CreateOrderItemRequest.builder()
                        .productId(item.getProductId())
                        .quantity(item.getQuantity())
                        .build())
                .collect(Collectors.toList());

        CreateOrderRequest orderRequest = CreateOrderRequest.builder()
                .customerId(customerId)
                .warehouseId(warehouseId)
                .notes(request.getNotes() != null ? request.getNotes() : "Customer self-service order")
                .items(itemRequests)
                .build();

        String username = userPrincipal != null ? userPrincipal.getUsername() : "CUSTOMER";
        OrderDto created = orderService.createOrder(orderRequest, username);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Order placed successfully"));
    }

    @GetMapping("/my-orders/{id}")
    public ResponseEntity<ApiResponse<OrderDto>> getMyOrderDetails(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));

        Long customerId = resolveCustomerId(userPrincipal);
        boolean isAdmin = userPrincipal != null && userPrincipal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && (customerId == null || !order.getCustomer().getId().equals(customerId))) {
            throw new ValidationException("Access denied: You can only view orders placed under your account.");
        }

        OrderDto dto = orderService.mapToDto(order);
        return ResponseEntity.ok(ApiResponse.success(dto, "Order details retrieved successfully"));
    }

    private Long resolveCustomerId(UserDetailsImpl userPrincipal) {
        if (userPrincipal == null) return null;
        if (userPrincipal.getCustomerId() != null) return userPrincipal.getCustomerId();

        return customerRepository.findByEmail(userPrincipal.getEmail())
                .map(com.retail.inventory.order.entity.Customer::getId)
                .orElse(null);
    }
}
