package com.retail.inventory.procurement.service;

import com.retail.inventory.admin.entity.AuditLog;
import com.retail.inventory.admin.repository.AuditLogRepository;
import com.retail.inventory.catalog.entity.Product;
import com.retail.inventory.catalog.repository.ProductRepository;
import com.retail.inventory.common.exception.ResourceNotFoundException;
import com.retail.inventory.common.exception.ValidationException;
import com.retail.inventory.inventory.service.InventoryService;
import com.retail.inventory.procurement.dto.PurchaseOrderDto;
import com.retail.inventory.procurement.dto.PurchaseOrderItemRequest;
import com.retail.inventory.procurement.dto.PurchaseOrderRequest;
import com.retail.inventory.procurement.entity.PurchaseOrder;
import com.retail.inventory.procurement.entity.PurchaseOrderItem;
import com.retail.inventory.procurement.entity.PurchaseOrderStatus;
import com.retail.inventory.procurement.entity.Supplier;
import com.retail.inventory.procurement.repository.PurchaseOrderRepository;
import com.retail.inventory.procurement.repository.SupplierRepository;
import com.retail.inventory.warehouse.entity.Warehouse;
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
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProcurementService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;
    private final AuditLogRepository auditLogRepository;
    private final com.retail.inventory.notification.service.NotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<PurchaseOrderDto> getPurchaseOrders(
            PurchaseOrderStatus status,
            Long warehouseId,
            Long supplierId,
            String search,
            Pageable pageable
    ) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim().toLowerCase() : null;

        Specification<PurchaseOrder> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (warehouseId != null) {
                predicates.add(cb.equal(root.get("warehouse").get("id"), warehouseId));
            }
            if (supplierId != null) {
                predicates.add(cb.equal(root.get("supplier").get("id"), supplierId));
            }
            if (cleanSearch != null) {
                Predicate poLike = cb.like(cb.lower(root.get("poNumber")), "%" + cleanSearch + "%");
                Predicate supplierLike = cb.like(cb.lower(root.get("supplier").get("name")), "%" + cleanSearch + "%");
                predicates.add(cb.or(poLike, supplierLike));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return purchaseOrderRepository.findAll(spec, pageable).map(PurchaseOrderDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public PurchaseOrderDto getPurchaseOrderById(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", "id", id));
        return PurchaseOrderDto.fromEntity(po);
    }

    @Transactional
    public PurchaseOrderDto createPurchaseOrder(PurchaseOrderRequest request, String performedBy) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", request.getSupplierId()));
        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", request.getWarehouseId()));

        String poNumber = "PO-" + System.currentTimeMillis();

        PurchaseOrder po = PurchaseOrder.builder()
                .poNumber(poNumber)
                .supplier(supplier)
                .warehouse(warehouse)
                .status(PurchaseOrderStatus.DRAFT)
                .notes(request.getNotes())
                .items(new ArrayList<>())
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (PurchaseOrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemReq.getProductId()));

            PurchaseOrderItem item = PurchaseOrderItem.builder()
                    .purchaseOrder(po)
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .unitCost(itemReq.getUnitCost())
                    .build();

            po.addItem(item);
            total = total.add(item.getSubtotal());
        }

        po.setTotalAmount(total);
        PurchaseOrder saved = purchaseOrderRepository.save(po);

        auditLogRepository.save(AuditLog.builder()
                .action("PURCHASE_ORDER_CREATED")
                .entityName("PurchaseOrder")
                .entityId(saved.getId().toString())
                .performedBy(performedBy != null ? performedBy : "SYSTEM")
                .details(String.format("Created PO '%s' for Supplier '%s' (Total: $%s)",
                        saved.getPoNumber(), supplier.getName(), total))
                .build());

        log.info("Purchase Order '{}' created by '{}' (Total: {})", saved.getPoNumber(), performedBy, total);
        return PurchaseOrderDto.fromEntity(saved);
    }

    @Transactional
    public PurchaseOrderDto updatePurchaseOrder(Long id, PurchaseOrderRequest request, String performedBy) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", "id", id));

        if (po.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new ValidationException("Only DRAFT purchase orders can be modified.");
        }

        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", request.getSupplierId()));
        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", request.getWarehouseId()));

        po.setSupplier(supplier);
        po.setWarehouse(warehouse);
        po.setNotes(request.getNotes());
        po.getItems().clear();

        BigDecimal total = BigDecimal.ZERO;
        for (PurchaseOrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemReq.getProductId()));

            PurchaseOrderItem item = PurchaseOrderItem.builder()
                    .purchaseOrder(po)
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .unitCost(itemReq.getUnitCost())
                    .build();

            po.addItem(item);
            total = total.add(item.getSubtotal());
        }

        po.setTotalAmount(total);
        PurchaseOrder saved = purchaseOrderRepository.save(po);

        auditLogRepository.save(AuditLog.builder()
                .action("PURCHASE_ORDER_UPDATED")
                .entityName("PurchaseOrder")
                .entityId(saved.getId().toString())
                .performedBy(performedBy != null ? performedBy : "SYSTEM")
                .details(String.format("Updated PO '%s' line items and details", saved.getPoNumber()))
                .build());

        return PurchaseOrderDto.fromEntity(saved);
    }

    @Transactional
    public PurchaseOrderDto submitPurchaseOrder(Long id, String performedBy) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", "id", id));

        if (po.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new ValidationException("Only DRAFT purchase orders can be submitted.");
        }

        po.setStatus(PurchaseOrderStatus.SUBMITTED);
        PurchaseOrder saved = purchaseOrderRepository.save(po);

        auditLogRepository.save(AuditLog.builder()
                .action("PURCHASE_ORDER_SUBMITTED")
                .entityName("PurchaseOrder")
                .entityId(saved.getId().toString())
                .performedBy(performedBy != null ? performedBy : "SYSTEM")
                .details(String.format("Submitted PO '%s' to vendor for fulfillment", saved.getPoNumber()))
                .build());

        try {
            notificationService.createNotification(
                    com.retail.inventory.notification.entity.NotificationType.PO_STATUS,
                    "PO Submitted to Vendor",
                    "Purchase Order " + saved.getPoNumber() + " submitted to " + (saved.getSupplier() != null ? saved.getSupplier().getName() : "vendor"),
                    saved.getPoNumber()
            );
        } catch (Exception ex) {
            log.warn("Failed to create notification for PO {}: {}", saved.getPoNumber(), ex.getMessage());
        }

        log.info("Purchase Order '{}' submitted by '{}'", saved.getPoNumber(), performedBy);
        return PurchaseOrderDto.fromEntity(saved);
    }

    @Transactional
    public PurchaseOrderDto receiveGoods(Long poId, String performedBy) {
        PurchaseOrder po = purchaseOrderRepository.findById(poId)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", "id", poId));

        if (po.getStatus() != PurchaseOrderStatus.SUBMITTED && po.getStatus() != PurchaseOrderStatus.CONFIRMED) {
            throw new ValidationException(String.format(
                    "Goods can only be received for SUBMITTED or CONFIRMED purchase orders. Current status is '%s'.",
                    po.getStatus()
            ));
        }

        // Replenish warehouse stock for each line item using InventoryService
        for (PurchaseOrderItem item : po.getItems()) {
            inventoryService.stockIn(
                    item.getProduct().getId(),
                    po.getWarehouse().getId(),
                    item.getQuantity(),
                    "Goods Receipt against PO " + po.getPoNumber(),
                    po.getPoNumber(),
                    performedBy
            );
        }

        po.setStatus(PurchaseOrderStatus.RECEIVED);
        PurchaseOrder saved = purchaseOrderRepository.save(po);

        auditLogRepository.save(AuditLog.builder()
                .action("GOODS_RECEIVED")
                .entityName("PurchaseOrder")
                .entityId(saved.getId().toString())
                .performedBy(performedBy != null ? performedBy : "SYSTEM")
                .details(String.format("Goods received for PO '%s' into '%s'. All inventory stock updated.",
                        saved.getPoNumber(), po.getWarehouse().getName()))
                .build());

        try {
            notificationService.createNotification(
                    com.retail.inventory.notification.entity.NotificationType.PO_STATUS,
                    "Goods Received & Stock Inbound",
                    "Purchase Order " + saved.getPoNumber() + " received into " + saved.getWarehouse().getName(),
                    saved.getPoNumber()
            );
        } catch (Exception ex) {
            log.warn("Failed to create notification for PO receipt {}: {}", saved.getPoNumber(), ex.getMessage());
        }

        log.info("PO '{}' marked RECEIVED by '{}'. Warehouse '{}' replenished.",
                saved.getPoNumber(), performedBy, po.getWarehouse().getName());
        return PurchaseOrderDto.fromEntity(saved);
    }

    @Transactional
    public PurchaseOrderDto cancelPurchaseOrder(Long id, String reason, String performedBy) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", "id", id));

        if (po.getStatus() == PurchaseOrderStatus.RECEIVED) {
            throw new ValidationException("Cannot cancel an order that has already been RECEIVED.");
        }
        if (po.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new ValidationException("Purchase order is already cancelled.");
        }

        po.setStatus(PurchaseOrderStatus.CANCELLED);
        PurchaseOrder saved = purchaseOrderRepository.save(po);

        auditLogRepository.save(AuditLog.builder()
                .action("PURCHASE_ORDER_CANCELLED")
                .entityName("PurchaseOrder")
                .entityId(saved.getId().toString())
                .performedBy(performedBy != null ? performedBy : "SYSTEM")
                .details(String.format("Cancelled PO '%s'. Reason: %s", saved.getPoNumber(), reason != null ? reason : "N/A"))
                .build());

        return PurchaseOrderDto.fromEntity(saved);
    }

    @Transactional
    public PurchaseOrderDto acknowledgePurchaseOrder(Long id, Long supplierId, String performedBy) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", "id", id));

        if (supplierId != null && (po.getSupplier() == null || !po.getSupplier().getId().equals(supplierId))) {
            throw new ValidationException("You can only acknowledge purchase orders assigned to your supplier company.");
        }

        if (po.getStatus() != PurchaseOrderStatus.SUBMITTED) {
            throw new ValidationException("Only SUBMITTED purchase orders can be acknowledged. Current status: " + po.getStatus());
        }

        po.setStatus(PurchaseOrderStatus.CONFIRMED);
        PurchaseOrder saved = purchaseOrderRepository.save(po);

        auditLogRepository.save(AuditLog.builder()
                .action("PURCHASE_ORDER_ACKNOWLEDGED")
                .entityName("PurchaseOrder")
                .entityId(saved.getId().toString())
                .performedBy(performedBy != null ? performedBy : "SUPPLIER")
                .details(String.format("Supplier acknowledged PO '%s'. Status updated to CONFIRMED.", saved.getPoNumber()))
                .build());

        try {
            notificationService.createNotification(
                    com.retail.inventory.notification.entity.NotificationType.PO_STATUS,
                    "PO Acknowledged by Vendor",
                    "Vendor confirmed PO " + saved.getPoNumber() + ". Order is in progress.",
                    saved.getPoNumber()
            );
        } catch (Exception ex) {
            log.warn("Failed to create notification for PO acknowledgment: {}", ex.getMessage());
        }

        log.info("PO '{}' acknowledged by supplier user '{}'. Status is now CONFIRMED.", saved.getPoNumber(), performedBy);
        return PurchaseOrderDto.fromEntity(saved);
    }
}
