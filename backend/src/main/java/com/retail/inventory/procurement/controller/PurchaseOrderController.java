package com.retail.inventory.procurement.controller;

import com.retail.inventory.auth.security.services.UserDetailsImpl;
import com.retail.inventory.common.dto.ApiResponse;
import com.retail.inventory.procurement.dto.PurchaseOrderDto;
import com.retail.inventory.procurement.dto.PurchaseOrderRequest;
import com.retail.inventory.procurement.entity.PurchaseOrderStatus;
import com.retail.inventory.procurement.service.ProcurementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final ProcurementService procurementService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PurchaseOrderDto>>> getPurchaseOrders(
            @RequestParam(required = false) PurchaseOrderStatus status,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PurchaseOrderDto> pos = procurementService.getPurchaseOrders(status, warehouseId, supplierId, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(pos, "Purchase orders retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseOrderDto>> getPurchaseOrderById(@PathVariable Long id) {
        PurchaseOrderDto po = procurementService.getPurchaseOrderById(id);
        return ResponseEntity.ok(ApiResponse.success(po, "Purchase order details retrieved successfully"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROCUREMENT_MANAGER')")
    public ResponseEntity<ApiResponse<PurchaseOrderDto>> createPurchaseOrder(
            @Valid @RequestBody PurchaseOrderRequest request,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        String username = userPrincipal != null ? userPrincipal.getUsername() : "SYSTEM";
        PurchaseOrderDto created = procurementService.createPurchaseOrder(request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Purchase order '" + created.getPoNumber() + "' created"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROCUREMENT_MANAGER')")
    public ResponseEntity<ApiResponse<PurchaseOrderDto>> updatePurchaseOrder(
            @PathVariable Long id,
            @Valid @RequestBody PurchaseOrderRequest request,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        String username = userPrincipal != null ? userPrincipal.getUsername() : "SYSTEM";
        PurchaseOrderDto updated = procurementService.updatePurchaseOrder(id, request, username);
        return ResponseEntity.ok(ApiResponse.success(updated, "Purchase order '" + updated.getPoNumber() + "' updated"));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROCUREMENT_MANAGER')")
    public ResponseEntity<ApiResponse<PurchaseOrderDto>> submitPurchaseOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        String username = userPrincipal != null ? userPrincipal.getUsername() : "SYSTEM";
        PurchaseOrderDto submitted = procurementService.submitPurchaseOrder(id, username);
        return ResponseEntity.ok(ApiResponse.success(submitted, "Purchase order submitted to supplier"));
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROCUREMENT_MANAGER')")
    public ResponseEntity<ApiResponse<PurchaseOrderDto>> receiveGoods(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        String username = userPrincipal != null ? userPrincipal.getUsername() : "SYSTEM";
        PurchaseOrderDto received = procurementService.receiveGoods(id, username);
        return ResponseEntity.ok(ApiResponse.success(received, "Goods received successfully and warehouse stock updated"));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROCUREMENT_MANAGER')")
    public ResponseEntity<ApiResponse<PurchaseOrderDto>> cancelPurchaseOrder(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        String username = userPrincipal != null ? userPrincipal.getUsername() : "SYSTEM";
        String reason = body != null ? body.get("reason") : "Order cancelled by manager";
        PurchaseOrderDto cancelled = procurementService.cancelPurchaseOrder(id, reason, username);
        return ResponseEntity.ok(ApiResponse.success(cancelled, "Purchase order cancelled"));
    }
}
