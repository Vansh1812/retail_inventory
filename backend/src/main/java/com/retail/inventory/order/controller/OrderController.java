package com.retail.inventory.order.controller;

import com.retail.inventory.auth.security.services.UserDetailsImpl;
import com.retail.inventory.common.dto.ApiResponse;
import com.retail.inventory.order.dto.CreateOrderRequest;
import com.retail.inventory.order.dto.OrderDto;
import com.retail.inventory.order.entity.OrderStatus;
import com.retail.inventory.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<OrderDto>>> getOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OrderDto> orders = orderService.getOrders(status, warehouseId, customerId, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(orders, "Orders retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderDto>> getOrderById(@PathVariable Long id) {
        OrderDto order = orderService.getOrderById(id);
        return ResponseEntity.ok(ApiResponse.success(order, "Order details retrieved successfully"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ORDER_MANAGER')")
    public ResponseEntity<ApiResponse<OrderDto>> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        String username = userPrincipal != null ? userPrincipal.getUsername() : "SYSTEM";
        OrderDto created = orderService.createOrder(request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Order created successfully"));
    }

    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORDER_MANAGER')")
    public ResponseEntity<ApiResponse<OrderDto>> confirmOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        String username = userPrincipal != null ? userPrincipal.getUsername() : "SYSTEM";
        OrderDto confirmed = orderService.confirmOrder(id, username);
        return ResponseEntity.ok(ApiResponse.success(confirmed, "Order confirmed and stock reserved successfully"));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORDER_MANAGER')")
    public ResponseEntity<ApiResponse<OrderDto>> cancelOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        String username = userPrincipal != null ? userPrincipal.getUsername() : "SYSTEM";
        OrderDto cancelled = orderService.cancelOrder(id, username);
        return ResponseEntity.ok(ApiResponse.success(cancelled, "Order cancelled successfully"));
    }
}
