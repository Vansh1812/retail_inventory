package com.retail.inventory.inventory.dto;

import com.retail.inventory.inventory.entity.Inventory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryDto {
    private Long id;
    private Long productId;
    private String productSku;
    private String productName;
    private String productCategory;
    private Long warehouseId;
    private String warehouseName;
    private String warehouseCity;
    private Integer totalQuantity;
    private Integer reservedQuantity;
    private Integer availableQuantity;
    private Integer reorderLevel;
    private boolean isLowStock;
    private Instant updatedAt;

    public static InventoryDto fromEntity(Inventory inventory) {
        int avail = inventory.getAvailableQuantity();
        int reorder = inventory.getReorderLevel() != null ? inventory.getReorderLevel() : 10;
        return InventoryDto.builder()
                .id(inventory.getId())
                .productId(inventory.getProduct().getId())
                .productSku(inventory.getProduct().getSku())
                .productName(inventory.getProduct().getName())
                .productCategory(inventory.getProduct().getCategory() != null ? inventory.getProduct().getCategory().getName() : "Uncategorized")
                .warehouseId(inventory.getWarehouse().getId())
                .warehouseName(inventory.getWarehouse().getName())
                .warehouseCity(inventory.getWarehouse().getCity())
                .totalQuantity(inventory.getTotalQuantity())
                .reservedQuantity(inventory.getReservedQuantity())
                .availableQuantity(avail)
                .reorderLevel(reorder)
                .isLowStock(avail <= reorder)
                .updatedAt(inventory.getUpdatedAt())
                .build();
    }
}
