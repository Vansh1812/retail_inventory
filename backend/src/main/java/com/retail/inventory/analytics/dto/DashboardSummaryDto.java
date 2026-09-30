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
public class DashboardSummaryDto {
    private Long totalProducts;
    private Long totalInventoryUnits;
    private BigDecimal totalValuation;
    private Long lowStockCount;
    private Long pendingOrdersCount;
    private Long activeWarehousesCount;
    private List<WarehouseStockSummaryDto> stockPerWarehouse;
    private List<OrderDto> recentOrders;
    private List<CriticalLowStockDto> criticalLowStockItems;
    private List<DailySalesVsSpendDto> dailySalesVsSpend;
}
