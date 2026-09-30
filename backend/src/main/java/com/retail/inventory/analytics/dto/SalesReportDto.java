package com.retail.inventory.analytics.dto;

import com.retail.inventory.order.dto.OrderDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesReportDto {
    private BigDecimal totalRevenue;
    private Long totalOrders;
    private Long totalUnitsSold;
    private BigDecimal averageOrderValue;
    private List<TopSellingProductDto> topProducts;
    private List<DailySalesVsSpendDto> dailyBreakdown;
    private List<OrderDto> orders;
}
