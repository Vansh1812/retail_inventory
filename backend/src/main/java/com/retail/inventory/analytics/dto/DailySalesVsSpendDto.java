package com.retail.inventory.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailySalesVsSpendDto {
    private LocalDate date;
    private BigDecimal salesRevenue;
    private BigDecimal procurementSpend;
    private Long orderCount;
}
