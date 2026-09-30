package com.retail.inventory.portal.controller;

import com.retail.inventory.auth.security.services.UserDetailsImpl;
import com.retail.inventory.common.dto.ApiResponse;
import com.retail.inventory.procurement.dto.PurchaseOrderDto;
import com.retail.inventory.procurement.entity.PurchaseOrder;
import com.retail.inventory.procurement.repository.PurchaseOrderRepository;
import com.retail.inventory.procurement.repository.SupplierRepository;
import com.retail.inventory.procurement.service.ProcurementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/portal/supplier")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPPLIER', 'ADMIN')")
public class SupplierPortalController {

    private final ProcurementService procurementService;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;

    @GetMapping("/my-purchase-orders")
    public ResponseEntity<ApiResponse<List<PurchaseOrderDto>>> getMyPurchaseOrders(
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        Long supplierId = resolveSupplierId(userPrincipal);
        if (supplierId == null) {
            List<PurchaseOrderDto> allPos = purchaseOrderRepository.findAll().stream()
                    .map(PurchaseOrderDto::fromEntity)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(allPos, "All purchase orders retrieved successfully"));
        }

        List<PurchaseOrder> orders = purchaseOrderRepository.findBySupplierIdOrderByCreatedAtDesc(supplierId);
        List<PurchaseOrderDto> dtos = orders.stream()
                .map(PurchaseOrderDto::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(dtos, "Supplier purchase orders retrieved successfully"));
    }

    @PutMapping("/purchase-orders/{id}/acknowledge")
    public ResponseEntity<ApiResponse<PurchaseOrderDto>> acknowledgePurchaseOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userPrincipal
    ) {
        Long supplierId = resolveSupplierId(userPrincipal);
        boolean isAdmin = userPrincipal != null && userPrincipal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        String performedBy = userPrincipal != null ? userPrincipal.getUsername() : "SUPPLIER";
        PurchaseOrderDto acknowledged = procurementService.acknowledgePurchaseOrder(
                id,
                isAdmin ? null : supplierId,
                performedBy
        );

        return ResponseEntity.ok(ApiResponse.success(acknowledged, "Purchase order acknowledged successfully"));
    }

    private Long resolveSupplierId(UserDetailsImpl userPrincipal) {
        if (userPrincipal == null) return null;
        if (userPrincipal.getSupplierId() != null) return userPrincipal.getSupplierId();

        return supplierRepository.findByEmail(userPrincipal.getEmail())
                .map(com.retail.inventory.procurement.entity.Supplier::getId)
                .orElse(null);
    }
}
