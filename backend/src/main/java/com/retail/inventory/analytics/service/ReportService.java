package com.retail.inventory.analytics.service;

import com.retail.inventory.analytics.dto.*;
import com.retail.inventory.inventory.entity.Inventory;
import com.retail.inventory.inventory.repository.InventoryRepository;
import com.retail.inventory.order.dto.OrderDto;
import com.retail.inventory.order.entity.Order;
import com.retail.inventory.order.entity.OrderItem;
import com.retail.inventory.order.entity.OrderStatus;
import com.retail.inventory.order.repository.OrderRepository;
import com.retail.inventory.order.service.OrderService;
import com.retail.inventory.procurement.dto.PurchaseOrderDto;
import com.retail.inventory.procurement.entity.PurchaseOrder;
import com.retail.inventory.procurement.entity.PurchaseOrderStatus;
import com.retail.inventory.procurement.repository.PurchaseOrderRepository;
import com.retail.inventory.warehouse.entity.Warehouse;
import com.retail.inventory.warehouse.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final InventoryRepository inventoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final OrderRepository orderRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final OrderService orderService;

    @Transactional(readOnly = true)
    public List<InventoryReportRowDto> getInventoryReport(Long warehouseId, Long categoryId) {
        List<Inventory> inventories = inventoryRepository.findAll();

        return inventories.stream()
                .filter(inv -> {
                    if (warehouseId != null && (inv.getWarehouse() == null || !inv.getWarehouse().getId().equals(warehouseId))) {
                        return false;
                    }
                    if (categoryId != null && (inv.getProduct() == null || inv.getProduct().getCategory() == null || !inv.getProduct().getCategory().getId().equals(categoryId))) {
                        return false;
                    }
                    return true;
                })
                .map(inv -> {
                    int totalQty = inv.getTotalQuantity() != null ? inv.getTotalQuantity() : 0;
                    int reservedQty = inv.getReservedQuantity() != null ? inv.getReservedQuantity() : 0;
                    int availQty = inv.getAvailableQuantity();
                    int reorder = inv.getReorderLevel() != null ? inv.getReorderLevel() : 0;

                    BigDecimal costPrice = (inv.getProduct() != null && inv.getProduct().getCostPrice() != null)
                            ? inv.getProduct().getCostPrice()
                            : BigDecimal.ZERO;
                    BigDecimal sellingPrice = (inv.getProduct() != null && inv.getProduct().getSellingPrice() != null)
                            ? inv.getProduct().getSellingPrice()
                            : BigDecimal.ZERO;

                    BigDecimal assetValue = costPrice.multiply(BigDecimal.valueOf(totalQty)).setScale(2, RoundingMode.HALF_UP);

                    String reorderStatus;
                    if (availQty <= 0) {
                        reorderStatus = "OUT_OF_STOCK";
                    } else if (availQty <= reorder) {
                        reorderStatus = "CRITICAL_LOW";
                    } else if (availQty <= (int) (reorder * 1.5)) {
                        reorderStatus = "LOW";
                    } else {
                        reorderStatus = "OPTIMAL";
                    }

                    return InventoryReportRowDto.builder()
                            .productId(inv.getProduct() != null ? inv.getProduct().getId() : null)
                            .sku(inv.getProduct() != null ? inv.getProduct().getSku() : "N/A")
                            .productName(inv.getProduct() != null ? inv.getProduct().getName() : "Unknown")
                            .categoryName((inv.getProduct() != null && inv.getProduct().getCategory() != null) ? inv.getProduct().getCategory().getName() : "Uncategorized")
                            .warehouseId(inv.getWarehouse() != null ? inv.getWarehouse().getId() : null)
                            .warehouseName(inv.getWarehouse() != null ? inv.getWarehouse().getName() : "Unknown")
                            .totalQuantity(totalQty)
                            .reservedQuantity(reservedQty)
                            .availableQuantity(availQty)
                            .reorderLevel(reorder)
                            .costPrice(costPrice)
                            .sellingPrice(sellingPrice)
                            .assetValue(assetValue)
                            .reorderStatus(reorderStatus)
                            .build();
                })
                .sorted(Comparator.comparing(InventoryReportRowDto::getProductName))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SalesReportDto getSalesReport(LocalDate startDate, LocalDate endDate, Long warehouseId) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        Instant startInstant = start.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endInstant = end.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        List<Order> orders = orderRepository.findByCreatedAtBetween(startInstant, endInstant);

        if (warehouseId != null) {
            orders = orders.stream()
                    .filter(o -> o.getWarehouse() != null && o.getWarehouse().getId().equals(warehouseId))
                    .collect(Collectors.toList());
        }

        BigDecimal totalRevenue = BigDecimal.ZERO;
        long totalUnitsSold = 0L;
        long validOrdersCount = 0L;

        Map<Long, TopSellingProductDto> productSalesMap = new HashMap<>();
        Map<LocalDate, BigDecimal> dailyRevenueMap = new HashMap<>();
        Map<LocalDate, Long> dailyOrderCountMap = new HashMap<>();

        for (Order o : orders) {
            if (o.getStatus() != OrderStatus.CANCELLED) {
                validOrdersCount++;
                BigDecimal amount = o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO;
                totalRevenue = totalRevenue.add(amount);

                LocalDate date = o.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
                dailyRevenueMap.merge(date, amount, BigDecimal::add);
                dailyOrderCountMap.merge(date, 1L, Long::sum);

                if (o.getItems() != null) {
                    for (OrderItem item : o.getItems()) {
                        int q = item.getQuantity() != null ? item.getQuantity() : 0;
                        totalUnitsSold += q;

                        if (item.getProduct() != null) {
                            Long pId = item.getProduct().getId();
                            BigDecimal itemTotal = item.getSubtotal();

                            productSalesMap.compute(pId, (k, existing) -> {
                                if (existing == null) {
                                    return TopSellingProductDto.builder()
                                            .productId(pId)
                                            .sku(item.getProduct().getSku())
                                            .productName(item.getProduct().getName())
                                            .unitsSold((long) q)
                                            .totalSales(itemTotal)
                                            .build();
                                } else {
                                    existing.setUnitsSold(existing.getUnitsSold() + q);
                                    existing.setTotalSales(existing.getTotalSales().add(itemTotal));
                                    return existing;
                                }
                            });
                        }
                    }
                }
            }
        }

        BigDecimal avgOrderValue = validOrdersCount > 0
                ? totalRevenue.divide(BigDecimal.valueOf(validOrdersCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<TopSellingProductDto> topProducts = productSalesMap.values().stream()
                .sorted(Comparator.comparing(TopSellingProductDto::getTotalSales).reversed())
                .limit(10)
                .collect(Collectors.toList());

        List<DailySalesVsSpendDto> dailyBreakdown = new ArrayList<>();
        LocalDate current = start;
        while (!current.isAfter(end)) {
            dailyBreakdown.add(DailySalesVsSpendDto.builder()
                    .date(current)
                    .salesRevenue(dailyRevenueMap.getOrDefault(current, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP))
                    .procurementSpend(BigDecimal.ZERO)
                    .orderCount(dailyOrderCountMap.getOrDefault(current, 0L))
                    .build());
            current = current.plusDays(1);
        }

        List<OrderDto> orderDtos = orders.stream()
                .map(orderService::mapToDto)
                .collect(Collectors.toList());

        return SalesReportDto.builder()
                .totalRevenue(totalRevenue.setScale(2, RoundingMode.HALF_UP))
                .totalOrders((long) orders.size())
                .totalUnitsSold(totalUnitsSold)
                .averageOrderValue(avgOrderValue)
                .topProducts(topProducts)
                .dailyBreakdown(dailyBreakdown)
                .orders(orderDtos)
                .build();
    }

    @Transactional(readOnly = true)
    public ProcurementReportDto getProcurementReport(LocalDate startDate, LocalDate endDate, Long supplierId) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        Instant startInstant = start.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endInstant = end.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        List<PurchaseOrder> pos = purchaseOrderRepository.findByCreatedAtBetween(startInstant, endInstant);

        if (supplierId != null) {
            pos = pos.stream()
                    .filter(po -> po.getSupplier() != null && po.getSupplier().getId().equals(supplierId))
                    .collect(Collectors.toList());
        }

        BigDecimal totalSpend = BigDecimal.ZERO;
        long receivedCount = 0L;
        long pendingCount = 0L;

        Map<String, Long> statusBreakdown = new HashMap<>();
        Map<Long, SupplierSpendDto> supplierSpendMap = new HashMap<>();

        for (PurchaseOrder po : pos) {
            String status = po.getStatus().name();
            statusBreakdown.merge(status, 1L, Long::sum);

            if (po.getStatus() == PurchaseOrderStatus.RECEIVED) {
                receivedCount++;
            } else if (po.getStatus() == PurchaseOrderStatus.DRAFT || po.getStatus() == PurchaseOrderStatus.SUBMITTED || po.getStatus() == PurchaseOrderStatus.CONFIRMED) {
                pendingCount++;
            }

            if (po.getStatus() != PurchaseOrderStatus.CANCELLED) {
                BigDecimal amount = po.getTotalAmount() != null ? po.getTotalAmount() : BigDecimal.ZERO;
                totalSpend = totalSpend.add(amount);

                if (po.getSupplier() != null) {
                    Long sId = po.getSupplier().getId();
                    String sName = po.getSupplier().getName();

                    supplierSpendMap.compute(sId, (k, existing) -> {
                        if (existing == null) {
                            return SupplierSpendDto.builder()
                                    .supplierId(sId)
                                    .supplierName(sName)
                                    .poCount(1L)
                                    .totalSpend(amount)
                                    .build();
                        } else {
                            existing.setPoCount(existing.getPoCount() + 1);
                            existing.setTotalSpend(existing.getTotalSpend().add(amount));
                            return existing;
                        }
                    });
                }
            }
        }

        List<SupplierSpendDto> supplierBreakdown = supplierSpendMap.values().stream()
                .sorted(Comparator.comparing(SupplierSpendDto::getTotalSpend).reversed())
                .collect(Collectors.toList());

        List<PurchaseOrderDto> poDtos = pos.stream()
                .map(PurchaseOrderDto::fromEntity)
                .collect(Collectors.toList());

        return ProcurementReportDto.builder()
                .totalSpend(totalSpend.setScale(2, RoundingMode.HALF_UP))
                .totalPurchaseOrders((long) pos.size())
                .receivedOrdersCount(receivedCount)
                .pendingOrdersCount(pendingCount)
                .statusBreakdown(statusBreakdown)
                .supplierBreakdown(supplierBreakdown)
                .purchaseOrders(poDtos)
                .build();
    }

    @Transactional(readOnly = true)
    public List<WarehouseUtilizationDto> getWarehouseUtilizationReport() {
        List<Warehouse> warehouses = warehouseRepository.findAll();
        List<Inventory> allInventory = inventoryRepository.findAll();

        Map<Long, List<Inventory>> inventoryByWarehouse = allInventory.stream()
                .filter(inv -> inv.getWarehouse() != null)
                .collect(Collectors.groupingBy(inv -> inv.getWarehouse().getId()));

        List<WarehouseUtilizationDto> result = new ArrayList<>();

        for (Warehouse wh : warehouses) {
            List<Inventory> items = inventoryByWarehouse.getOrDefault(wh.getId(), Collections.emptyList());

            long totalUnits = 0L;
            BigDecimal totalAssetValue = BigDecimal.ZERO;
            long lowStockCount = 0L;

            for (Inventory item : items) {
                int q = item.getTotalQuantity() != null ? item.getTotalQuantity() : 0;
                totalUnits += q;

                BigDecimal cost = (item.getProduct() != null && item.getProduct().getCostPrice() != null)
                        ? item.getProduct().getCostPrice()
                        : BigDecimal.ZERO;
                totalAssetValue = totalAssetValue.add(cost.multiply(BigDecimal.valueOf(q)));

                int avail = item.getAvailableQuantity();
                int reorder = item.getReorderLevel() != null ? item.getReorderLevel() : 0;
                if (avail <= reorder) {
                    lowStockCount++;
                }
            }

            int capacity = wh.getCapacity() != null ? wh.getCapacity() : 0;
            double utilPct = capacity > 0
                    ? BigDecimal.valueOf((totalUnits * 100.0) / capacity).setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            result.add(WarehouseUtilizationDto.builder()
                    .warehouseId(wh.getId())
                    .warehouseName(wh.getName())
                    .city(wh.getCity())
                    .capacity(capacity)
                    .totalUnits(totalUnits)
                    .utilizationPercentage(utilPct)
                    .totalAssetValue(totalAssetValue.setScale(2, RoundingMode.HALF_UP))
                    .lowStockSkuCount(lowStockCount)
                    .status(wh.getStatus().name())
                    .build());
        }

        return result;
    }
}
