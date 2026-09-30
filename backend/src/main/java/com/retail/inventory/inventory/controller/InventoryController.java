package com.retail.inventory.inventory.controller;

import com.retail.inventory.auth.security.services.UserDetailsImpl;
import com.retail.inventory.common.dto.ApiResponse;
import com.retail.inventory.inventory.dto.*;
import com.retail.inventory.inventory.entity.InventoryTransactionType;
import com.retail.inventory.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<List<InventoryDto>>> getOverview(
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean lowStockOnly
    ) {
        List<InventoryDto> list = inventoryService.getInventoryOverview(warehouseId, search, lowStockOnly);
        return ResponseEntity.ok(ApiResponse.success(list, "Inventory overview retrieved successfully"));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<Page<InventoryTransactionDto>>> getHistory(
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) InventoryTransactionType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        Page<InventoryTransactionDto> history = inventoryService.getTransactionHistory(warehouseId, productId, type, page, size);
        return ResponseEntity.ok(ApiResponse.success(history, "Inventory transaction history retrieved successfully"));
    }

    @PostMapping("/stock-in")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<ApiResponse<InventoryDto>> stockIn(
            @Valid @RequestBody StockOperationRequest request,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        String username = userPrincipal != null ? userPrincipal.getUsername() : "SYSTEM";
        InventoryDto updated = inventoryService.stockIn(
                request.getProductId(),
                request.getWarehouseId(),
                request.getQuantity(),
                request.getReason(),
                request.getReferenceId(),
                username
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(updated, "Successfully stocked in " + request.getQuantity() + " units"));
    }

    @PostMapping("/stock-out")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<ApiResponse<InventoryDto>> stockOut(
            @Valid @RequestBody StockOperationRequest request,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        String username = userPrincipal != null ? userPrincipal.getUsername() : "SYSTEM";
        InventoryDto updated = inventoryService.stockOut(
                request.getProductId(),
                request.getWarehouseId(),
                request.getQuantity(),
                request.getReason(),
                request.getReferenceId(),
                username
        );
        return ResponseEntity.ok(ApiResponse.success(updated, "Successfully dispatched " + request.getQuantity() + " units"));
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<ApiResponse<InventoryDto>> adjustStock(
            @Valid @RequestBody StockAdjustmentRequest request,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        String username = userPrincipal != null ? userPrincipal.getUsername() : "SYSTEM";
        InventoryDto updated = inventoryService.adjustStock(
                request.getProductId(),
                request.getWarehouseId(),
                request.getNewTotalQuantity(),
                request.getReason(),
                username
        );
        return ResponseEntity.ok(ApiResponse.success(updated, "Stock adjusted to " + request.getNewTotalQuantity() + " units"));
    }

    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> transferStock(
            @Valid @RequestBody StockTransferRequest request,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        String username = userPrincipal != null ? userPrincipal.getUsername() : "SYSTEM";
        inventoryService.transferStock(
                request.getSourceWarehouseId(),
                request.getDestinationWarehouseId(),
                request.getProductId(),
                request.getQuantity(),
                request.getReason(),
                username
        );
        return ResponseEntity.ok(ApiResponse.success(null, "Stock transfer of " + request.getQuantity() + " units completed successfully"));
    }
}
