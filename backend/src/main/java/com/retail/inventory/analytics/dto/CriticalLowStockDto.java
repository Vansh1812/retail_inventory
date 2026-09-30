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
public class CriticalLowStockDto {
    private Long productId;
    private String sku;
    private String productName;
    private Long warehouseId;
    private String warehouseName;
    private Integer availableQuantity;
    private Integer reorderLevel;
    private Integer deficit;
    private BigDecimal costPrice;
    private BigDecimal sellingPrice;
}
