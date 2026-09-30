package com.retail.inventory.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryReportRowDto {
    private Long productId;
    private String sku;
    private String productName;
    private String categoryName;
    private Long warehouseId;
    private String warehouseName;
    private Integer totalQuantity;
    private Integer reservedQuantity;
    private Integer availableQuantity;
    private Integer reorderLevel;
    private BigDecimal costPrice;
    private BigDecimal sellingPrice;
    private BigDecimal assetValue;
    private String reorderStatus;
}
