package com.retail.inventory.warehouse.controller;

import com.retail.inventory.auth.security.services.UserDetailsImpl;
import com.retail.inventory.common.dto.ApiResponse;
import com.retail.inventory.warehouse.dto.WarehouseDto;
import com.retail.inventory.warehouse.dto.WarehouseRequest;
import com.retail.inventory.warehouse.dto.WarehouseStatusRequest;
import com.retail.inventory.warehouse.entity.WarehouseStatus;
import com.retail.inventory.warehouse.service.WarehouseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WarehouseDto>>> getWarehouses(
            @RequestParam(required = false) WarehouseStatus status,
            @RequestParam(required = false) String search
    ) {
        List<WarehouseDto> list = warehouseService.getWarehouses(status, search);
        return ResponseEntity.ok(ApiResponse.success(list, "Warehouses retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WarehouseDto>> getWarehouseById(@PathVariable Long id) {
        WarehouseDto warehouse = warehouseService.getWarehouseById(id);
        return ResponseEntity.ok(ApiResponse.success(warehouse, "Warehouse details retrieved successfully"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ResponseEntity<ApiResponse<WarehouseDto>> createWarehouse(
            @Valid @RequestBody WarehouseRequest request,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        String username = userPrincipal != null ? userPrincipal.getUsername() : "SYSTEM";
        WarehouseDto created = warehouseService.createWarehouse(request, username);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Warehouse '" + created.getName() + "' created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ResponseEntity<ApiResponse<WarehouseDto>> updateWarehouse(
            @PathVariable Long id,
            @Valid @RequestBody WarehouseRequest request,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        String username = userPrincipal != null ? userPrincipal.getUsername() : "SYSTEM";
        WarehouseDto updated = warehouseService.updateWarehouse(id, request, username);
        return ResponseEntity.ok(ApiResponse.success(updated, "Warehouse '" + updated.getName() + "' updated successfully"));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ResponseEntity<ApiResponse<WarehouseDto>> updateWarehouseStatus(
            @PathVariable Long id,
            @RequestBody(required = false) WarehouseStatusRequest statusRequest,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        String username = userPrincipal != null ? userPrincipal.getUsername() : "SYSTEM";
        WarehouseStatus targetStatus = statusRequest != null ? statusRequest.getStatus() : null;
        WarehouseDto updated = warehouseService.updateWarehouseStatus(id, targetStatus, username);
        return ResponseEntity.ok(ApiResponse.success(updated, "Warehouse status changed to " + updated.getStatus()));
    }
}
