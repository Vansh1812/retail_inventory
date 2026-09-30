package com.retail.inventory.order.controller;

import com.retail.inventory.auth.security.services.UserDetailsImpl;
import com.retail.inventory.common.dto.ApiResponse;
import com.retail.inventory.order.dto.DispatchOrderRequest;
import com.retail.inventory.order.dto.OrderDto;
import com.retail.inventory.order.dto.UpdateOrderStatusRequest;
import com.retail.inventory.order.service.FulfillmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/fulfillment")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'ORDER_MANAGER', 'WAREHOUSE_MANAGER')")
public class FulfillmentController {

    private final FulfillmentService fulfillmentService;

    @GetMapping("/queue")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getFulfillmentQueue(
            @RequestParam(required = false) Long warehouseId
    ) {
        List<OrderDto> queue = fulfillmentService.getFulfillmentQueue(warehouseId);
        return ResponseEntity.ok(ApiResponse.success(queue, "Fulfillment queue retrieved successfully"));
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<ApiResponse<OrderDto>> updateOrderStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        String username = userPrincipal != null ? userPrincipal.getUsername() : "SYSTEM";
        OrderDto updated = fulfillmentService.updateOrderStatus(orderId, request.getStatus(), username);
        return ResponseEntity.ok(ApiResponse.success(updated, "Order fulfillment status updated to " + request.getStatus()));
    }

    @PostMapping("/{orderId}/ship")
    public ResponseEntity<ApiResponse<OrderDto>> dispatchOrder(
            @PathVariable Long orderId,
            @Valid @RequestBody DispatchOrderRequest request,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        String username = userPrincipal != null ? userPrincipal.getUsername() : "SYSTEM";
        OrderDto dispatched = fulfillmentService.dispatchOrder(orderId, request, username);
        return ResponseEntity.ok(ApiResponse.success(dispatched, "Order dispatched successfully via " + request.getCarrier()));
    }
}
