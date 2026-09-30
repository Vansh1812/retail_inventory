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
public class WarehouseStockSummaryDto {
    private Long warehouseId;
    private String warehouseName;
    private String city;
    private Integer capacity;
    private Long totalUnits;
    private BigDecimal totalValuation;
    private Double utilizationPercentage;
}
