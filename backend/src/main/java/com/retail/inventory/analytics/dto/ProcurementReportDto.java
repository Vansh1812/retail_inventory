package com.retail.inventory.analytics.dto;

import com.retail.inventory.procurement.dto.PurchaseOrderDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcurementReportDto {
    private BigDecimal totalSpend;
    private Long totalPurchaseOrders;
    private Long receivedOrdersCount;
    private Long pendingOrdersCount;
    private Map<String, Long> statusBreakdown;
    private List<SupplierSpendDto> supplierBreakdown;
    private List<PurchaseOrderDto> purchaseOrders;
}
