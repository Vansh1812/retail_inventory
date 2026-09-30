package com.retail.inventory.inventory.service;

import com.retail.inventory.admin.entity.AuditLog;
import com.retail.inventory.admin.repository.AuditLogRepository;
import com.retail.inventory.catalog.entity.Product;
import com.retail.inventory.catalog.repository.ProductRepository;
import com.retail.inventory.common.exception.InsufficientStockException;
import com.retail.inventory.common.exception.ResourceNotFoundException;
import com.retail.inventory.common.exception.ValidationException;
import com.retail.inventory.inventory.dto.*;
import com.retail.inventory.inventory.entity.Inventory;
import com.retail.inventory.inventory.entity.InventoryTransaction;
import com.retail.inventory.inventory.entity.InventoryTransactionType;
import com.retail.inventory.inventory.repository.InventoryRepository;
import com.retail.inventory.inventory.repository.InventoryTransactionRepository;
import com.retail.inventory.warehouse.entity.Warehouse;
import com.retail.inventory.warehouse.repository.WarehouseRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final AuditLogRepository auditLogRepository;
    private final com.retail.inventory.notification.service.NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<InventoryDto> getInventoryOverview(Long warehouseId, String search, Boolean lowStockOnly) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim().toLowerCase() : null;

        Specification<Inventory> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (warehouseId != null) {
                predicates.add(cb.equal(root.get("warehouse").get("id"), warehouseId));
            }

            if (cleanSearch != null) {
                String pattern = "%" + cleanSearch + "%";
                Predicate skuLike = cb.like(cb.lower(root.get("product").get("sku")), pattern);
                Predicate nameLike = cb.like(cb.lower(root.get("product").get("name")), pattern);
                predicates.add(cb.or(skuLike, nameLike));
            }

            if (Boolean.TRUE.equals(lowStockOnly)) {
                // available = totalQuantity - reservedQuantity <= reorderLevel
                predicates.add(cb.le(
                        cb.diff(root.get("totalQuantity"), root.get("reservedQuantity")),
                        root.get("reorderLevel")
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<Inventory> list = inventoryRepository.findAll(spec, Sort.by(Sort.Direction.ASC, "product.name"));
        return list.stream().map(InventoryDto::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public Page<InventoryTransactionDto> getTransactionHistory(
            Long warehouseId,
            Long productId,
            InventoryTransactionType type,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));

        Specification<InventoryTransaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (warehouseId != null) {
                predicates.add(cb.equal(root.get("warehouse").get("id"), warehouseId));
            }

            if (productId != null) {
                predicates.add(cb.equal(root.get("product").get("id"), productId));
            }

            if (type != null) {
                predicates.add(cb.equal(root.get("transactionType"), type));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<InventoryTransaction> transactions = transactionRepository.findAll(spec, pageable);
        return transactions.map(InventoryTransactionDto::fromEntity);
    }

    @Transactional
    public InventoryDto stockIn(Long productId, Long warehouseId, Integer qty, String reason, String referenceId, String user) {
        if (qty == null || qty <= 0) {
            throw new ValidationException("Quantity must be greater than zero");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", warehouseId));

        // Acquire or create inventory row
        Inventory inventory = getOrCreateForUpdate(product, warehouse);
        inventory.setTotalQuantity(inventory.getTotalQuantity() + qty);
        Inventory saved = inventoryRepository.save(inventory);

        // Record immutable ledger entry
        String ref = (referenceId != null && !referenceId.trim().isEmpty())
                ? referenceId.trim()
                : "IN-" + System.currentTimeMillis();

        InventoryTransaction tx = InventoryTransaction.builder()
                .product(product)
                .warehouse(warehouse)
                .quantityDelta(qty)
                .transactionType(InventoryTransactionType.STOCK_IN)
                .referenceId(ref)
                .performedBy(user != null ? user : "SYSTEM")
                .reason(reason != null ? reason.trim() : "Standard stock-in")
                .timestamp(Instant.now())
                .build();
        transactionRepository.save(tx);

        auditLogRepository.save(AuditLog.builder()
                .action("STOCK_IN")
                .entityName("Inventory")
                .entityId(saved.getId().toString())
                .performedBy(user != null ? user : "SYSTEM")
                .details(String.format("Added +%d units of SKU '%s' into '%s'. New total: %d",
                        qty, product.getSku(), warehouse.getName(), saved.getTotalQuantity()))
                .build());

        log.info("StockIn +{} for SKU '{}' in Warehouse '{}' by '{}'", qty, product.getSku(), warehouse.getName(), user);
        return InventoryDto.fromEntity(saved);
    }

    @Transactional
    public InventoryDto stockOut(Long productId, Long warehouseId, Integer qty, String reason, String referenceId, String user) {
        if (qty == null || qty <= 0) {
            throw new ValidationException("Quantity must be greater than zero");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", warehouseId));

        Inventory inventory = inventoryRepository.findForUpdate(productId, warehouseId)
                .orElseThrow(() -> new InsufficientStockException(product.getSku(), qty, 0));

        if (inventory.getAvailableQuantity() < qty) {
            throw new InsufficientStockException(product.getSku(), qty, inventory.getAvailableQuantity());
        }

        inventory.setTotalQuantity(inventory.getTotalQuantity() - qty);
        Inventory saved = inventoryRepository.save(inventory);

        String ref = (referenceId != null && !referenceId.trim().isEmpty())
                ? referenceId.trim()
                : "OUT-" + System.currentTimeMillis();

        InventoryTransaction tx = InventoryTransaction.builder()
                .product(product)
                .warehouse(warehouse)
                .quantityDelta(-qty)
                .transactionType(InventoryTransactionType.STOCK_OUT)
                .referenceId(ref)
                .performedBy(user != null ? user : "SYSTEM")
                .reason(reason != null ? reason.trim() : "Standard stock-out")
                .timestamp(Instant.now())
                .build();
        transactionRepository.save(tx);

        auditLogRepository.save(AuditLog.builder()
                .action("STOCK_OUT")
                .entityName("Inventory")
                .entityId(saved.getId().toString())
                .performedBy(user != null ? user : "SYSTEM")
                .details(String.format("Dispatched -%d units of SKU '%s' from '%s'. Remaining total: %d",
                        qty, product.getSku(), warehouse.getName(), saved.getTotalQuantity()))
                .build());

        checkLowStockAlert(saved);
        log.info("StockOut -{} for SKU '{}' in Warehouse '{}' by '{}'", qty, product.getSku(), warehouse.getName(), user);
        return InventoryDto.fromEntity(saved);
    }

    @Transactional
    public InventoryDto adjustStock(Long productId, Long warehouseId, Integer newTotalQty, String reason, String user) {
        if (newTotalQty == null || newTotalQty < 0) {
            throw new ValidationException("New total quantity must be 0 or greater");
        }
        if (reason == null || reason.trim().isEmpty()) {
            throw new ValidationException("Reason for adjustment is mandatory for auditing");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", warehouseId));

        Inventory inventory = getOrCreateForUpdate(product, warehouse);

        if (newTotalQty < inventory.getReservedQuantity()) {
            throw new ValidationException(String.format(
                    "Cannot adjust total stock (%d) below currently reserved stock (%d) for active orders.",
                    newTotalQty, inventory.getReservedQuantity()
            ));
        }

        int delta = newTotalQty - inventory.getTotalQuantity();
        inventory.setTotalQuantity(newTotalQty);
        Inventory saved = inventoryRepository.save(inventory);

        InventoryTransaction tx = InventoryTransaction.builder()
                .product(product)
                .warehouse(warehouse)
                .quantityDelta(delta)
                .transactionType(InventoryTransactionType.ADJUSTMENT)
                .referenceId("ADJ-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .performedBy(user != null ? user : "SYSTEM")
                .reason(reason.trim())
                .timestamp(Instant.now())
                .build();
        transactionRepository.save(tx);

        auditLogRepository.save(AuditLog.builder()
                .action("STOCK_ADJUSTMENT")
                .entityName("Inventory")
                .entityId(saved.getId().toString())
                .performedBy(user != null ? user : "SYSTEM")
                .details(String.format("Adjusted SKU '%s' at '%s' from %d to %d (Delta: %+d). Reason: %s",
                        product.getSku(), warehouse.getName(), inventory.getTotalQuantity() - delta, newTotalQty, delta, reason.trim()))
                .build());

        checkLowStockAlert(saved);
        log.info("AdjustStock SKU '{}' in Warehouse '{}' to {} (Delta: {}) by '{}'",
                product.getSku(), warehouse.getName(), newTotalQty, delta, user);
        return InventoryDto.fromEntity(saved);
    }

    @Transactional
    public void transferStock(Long srcWhId, Long destWhId, Long productId, Integer qty, String reason, String user) {
        if (srcWhId.equals(destWhId)) {
            throw new ValidationException("Source and destination warehouses cannot be the same");
        }
        if (qty == null || qty <= 0) {
            throw new ValidationException("Transfer quantity must be at least 1");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        Warehouse srcWarehouse = warehouseRepository.findById(srcWhId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", srcWhId));
        Warehouse destWarehouse = warehouseRepository.findById(destWhId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", destWhId));

        // Deadlock-free locking: strictly order locking by warehouse ID
        Long firstId = Math.min(srcWhId, destWhId);
        Long secondId = Math.max(srcWhId, destWhId);

        Warehouse firstWh = firstId.equals(srcWhId) ? srcWarehouse : destWarehouse;
        Warehouse secondWh = secondId.equals(srcWhId) ? srcWarehouse : destWarehouse;

        Inventory firstInv = getOrCreateForUpdate(product, firstWh);
        Inventory secondInv = getOrCreateForUpdate(product, secondWh);

        Inventory srcInv = srcWhId.equals(firstId) ? firstInv : secondInv;
        Inventory destInv = destWhId.equals(firstId) ? firstInv : secondInv;

        if (srcInv.getAvailableQuantity() < qty) {
            throw new InsufficientStockException(product.getSku(), qty, srcInv.getAvailableQuantity());
        }

        // Apply transfer deltas
        srcInv.setTotalQuantity(srcInv.getTotalQuantity() - qty);
        destInv.setTotalQuantity(destInv.getTotalQuantity() + qty);

        inventoryRepository.save(srcInv);
        inventoryRepository.save(destInv);

        String transferRef = "TRF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String note = (reason != null && !reason.trim().isEmpty()) ? reason.trim() : "Inter-warehouse transfer";

        // Dual ledger entries
        InventoryTransaction outTx = InventoryTransaction.builder()
                .product(product)
                .warehouse(srcWarehouse)
                .quantityDelta(-qty)
                .transactionType(InventoryTransactionType.TRANSFER_OUT)
                .referenceId(transferRef)
                .performedBy(user != null ? user : "SYSTEM")
                .reason(String.format("Transfer to %s: %s", destWarehouse.getName(), note))
                .timestamp(Instant.now())
                .build();

        InventoryTransaction inTx = InventoryTransaction.builder()
                .product(product)
                .warehouse(destWarehouse)
                .quantityDelta(qty)
                .transactionType(InventoryTransactionType.TRANSFER_IN)
                .referenceId(transferRef)
                .performedBy(user != null ? user : "SYSTEM")
                .reason(String.format("Transfer from %s: %s", srcWarehouse.getName(), note))
                .timestamp(Instant.now())
                .build();

        transactionRepository.save(outTx);
        transactionRepository.save(inTx);

        auditLogRepository.save(AuditLog.builder()
                .action("STOCK_TRANSFER")
                .entityName("Inventory")
                .entityId(srcInv.getId() + "->" + destInv.getId())
                .performedBy(user != null ? user : "SYSTEM")
                .details(String.format("Transferred %d units of SKU '%s' from '%s' to '%s' (Ref: %s)",
                        qty, product.getSku(), srcWarehouse.getName(), destWarehouse.getName(), transferRef))
                .build());

        checkLowStockAlert(srcInv);
        log.info("Transferred {} units of SKU '{}' from '{}' to '{}' (Ref: {}) by '{}'",
                qty, product.getSku(), srcWarehouse.getName(), destWarehouse.getName(), transferRef, user);
    }

    private void checkLowStockAlert(Inventory inventory) {
        if (inventory != null && inventory.getAvailableQuantity() <= inventory.getReorderLevel()) {
            try {
                notificationService.createNotification(
                        com.retail.inventory.notification.entity.NotificationType.LOW_STOCK,
                        "Low Stock Warning: " + inventory.getProduct().getSku(),
                        String.format("Product %s (%s) is low in stock (%d units available) in %s.",
                                inventory.getProduct().getName(),
                                inventory.getProduct().getSku(),
                                inventory.getAvailableQuantity(),
                                inventory.getWarehouse().getName()),
                        inventory.getProduct().getSku()
                );
            } catch (Exception e) {
                log.warn("Failed to generate low stock notification: {}", e.getMessage());
            }
        }
    }

    private Inventory getOrCreateForUpdate(Product product, Warehouse warehouse) {
        return inventoryRepository.findForUpdate(product.getId(), warehouse.getId())
                .orElseGet(() -> {
                    // Check if non-locked row already existed
                    return inventoryRepository.findByProductIdAndWarehouseId(product.getId(), warehouse.getId())
                            .orElseGet(() -> {
                                Inventory newRow = Inventory.builder()
                                        .product(product)
                                        .warehouse(warehouse)
                                        .totalQuantity(0)
                                        .reservedQuantity(0)
                                        .reorderLevel(product.getReorderLevel() != null ? product.getReorderLevel() : 10)
                                        .build();
                                return inventoryRepository.save(newRow);
                            });
                });
    }
}
