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
public class SupplierSpendDto {
    private Long supplierId;
    private String supplierName;
    private Long poCount;
    private BigDecimal totalSpend;
}
