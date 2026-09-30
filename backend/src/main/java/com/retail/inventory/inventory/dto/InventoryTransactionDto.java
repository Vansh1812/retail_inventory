package com.retail.inventory.inventory.dto;

import com.retail.inventory.inventory.entity.InventoryTransaction;
import com.retail.inventory.inventory.entity.InventoryTransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryTransactionDto {
    private Long id;
    private Long productId;
    private String productSku;
    private String productName;
    private Long warehouseId;
    private String warehouseName;
    private Integer quantityDelta;
    private InventoryTransactionType transactionType;
    private String referenceId;
    private String performedBy;
    private String reason;
    private Instant timestamp;

    public static InventoryTransactionDto fromEntity(InventoryTransaction tx) {
        return InventoryTransactionDto.builder()
                .id(tx.getId())
                .productId(tx.getProduct().getId())
                .productSku(tx.getProduct().getSku())
                .productName(tx.getProduct().getName())
                .warehouseId(tx.getWarehouse().getId())
                .warehouseName(tx.getWarehouse().getName())
                .quantityDelta(tx.getQuantityDelta())
                .transactionType(tx.getTransactionType())
                .referenceId(tx.getReferenceId())
                .performedBy(tx.getPerformedBy())
                .reason(tx.getReason())
                .timestamp(tx.getTimestamp())
                .build();
    }
}
