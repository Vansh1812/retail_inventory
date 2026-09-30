package com.retail.inventory.analytics.service;

import com.retail.inventory.analytics.dto.CriticalLowStockDto;
import com.retail.inventory.analytics.dto.DailySalesVsSpendDto;
import com.retail.inventory.analytics.dto.DashboardSummaryDto;
import com.retail.inventory.analytics.dto.WarehouseStockSummaryDto;
import com.retail.inventory.catalog.entity.ProductStatus;
import com.retail.inventory.catalog.repository.ProductRepository;
import com.retail.inventory.inventory.entity.Inventory;
import com.retail.inventory.inventory.repository.InventoryRepository;
import com.retail.inventory.order.dto.OrderDto;
import com.retail.inventory.order.entity.Order;
import com.retail.inventory.order.entity.OrderStatus;
import com.retail.inventory.order.repository.OrderRepository;
import com.retail.inventory.order.service.OrderService;
import com.retail.inventory.procurement.entity.PurchaseOrder;
import com.retail.inventory.procurement.entity.PurchaseOrderStatus;
import com.retail.inventory.procurement.repository.PurchaseOrderRepository;
import com.retail.inventory.warehouse.entity.Warehouse;
import com.retail.inventory.warehouse.entity.WarehouseStatus;
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
public class DashboardService {

    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryRepository inventoryRepository;
    private final OrderRepository orderRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final OrderService orderService;

    @Transactional(readOnly = true)
    public DashboardSummaryDto getDashboardSummary() {
        // 1. Basic counts
        long totalProducts = productRepository.countByStatus(ProductStatus.ACTIVE);
        long activeWarehousesCount = warehouseRepository.countByStatus(WarehouseStatus.ACTIVE);
        long pendingOrdersCount = orderRepository.countByStatusIn(List.of(OrderStatus.PENDING, OrderStatus.CONFIRMED));

        // 2. Fetch all inventory rows
        List<Inventory> allInventory = inventoryRepository.findAll();
        long totalInventoryUnits = 0L;
        BigDecimal totalValuation = BigDecimal.ZERO;
        long lowStockCount = 0L;

        Map<Long, List<Inventory>> inventoryByWarehouse = new HashMap<>();

        for (Inventory inv : allInventory) {
            int qty = inv.getTotalQuantity() != null ? inv.getTotalQuantity() : 0;
            totalInventoryUnits += qty;

            BigDecimal costPrice = (inv.getProduct() != null && inv.getProduct().getCostPrice() != null)
                    ? inv.getProduct().getCostPrice()
                    : BigDecimal.ZERO;
            totalValuation = totalValuation.add(costPrice.multiply(BigDecimal.valueOf(qty)));

            int available = inv.getAvailableQuantity();
            int reorder = inv.getReorderLevel() != null ? inv.getReorderLevel() : 0;
            if (available <= reorder) {
                lowStockCount++;
            }

            if (inv.getWarehouse() != null) {
                inventoryByWarehouse.computeIfAbsent(inv.getWarehouse().getId(), k -> new ArrayList<>()).add(inv);
            }
        }

        // 3. Warehouse breakdown
        List<Warehouse> warehouses = warehouseRepository.findAll();
        List<WarehouseStockSummaryDto> stockPerWarehouse = new ArrayList<>();
        for (Warehouse wh : warehouses) {
            List<Inventory> whInventories = inventoryByWarehouse.getOrDefault(wh.getId(), Collections.emptyList());
            long whUnits = 0L;
            BigDecimal whValuation = BigDecimal.ZERO;

            for (Inventory inv : whInventories) {
                int q = inv.getTotalQuantity() != null ? inv.getTotalQuantity() : 0;
                whUnits += q;
                BigDecimal cost = (inv.getProduct() != null && inv.getProduct().getCostPrice() != null)
                        ? inv.getProduct().getCostPrice()
                        : BigDecimal.ZERO;
                whValuation = whValuation.add(cost.multiply(BigDecimal.valueOf(q)));
            }

            int capacity = wh.getCapacity() != null ? wh.getCapacity() : 0;
            double utilPct = capacity > 0
                    ? BigDecimal.valueOf((whUnits * 100.0) / capacity).setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            stockPerWarehouse.add(WarehouseStockSummaryDto.builder()
                    .warehouseId(wh.getId())
                    .warehouseName(wh.getName())
                    .city(wh.getCity())
                    .capacity(capacity)
                    .totalUnits(whUnits)
                    .totalValuation(whValuation.setScale(2, RoundingMode.HALF_UP))
                    .utilizationPercentage(utilPct)
                    .build());
        }

        // 4. Recent orders (top 5)
        List<Order> recentOrdersList = orderRepository.findTop5ByOrderByCreatedAtDesc();
        List<OrderDto> recentOrders = recentOrdersList.stream()
                .map(orderService::mapToDto)
                .collect(Collectors.toList());

        // 5. Critical low stock items (top 5)
        List<CriticalLowStockDto> criticalLowStockItems = allInventory.stream()
                .filter(inv -> inv.getAvailableQuantity() <= (inv.getReorderLevel() != null ? inv.getReorderLevel() : 0))
                .sorted(Comparator.comparingInt(inv -> (inv.getAvailableQuantity() - (inv.getReorderLevel() != null ? inv.getReorderLevel() : 0))))
                .limit(5)
                .map(inv -> {
                    int avail = inv.getAvailableQuantity();
                    int reorder = inv.getReorderLevel() != null ? inv.getReorderLevel() : 0;
                    return CriticalLowStockDto.builder()
                            .productId(inv.getProduct() != null ? inv.getProduct().getId() : null)
                            .sku(inv.getProduct() != null ? inv.getProduct().getSku() : "N/A")
                            .productName(inv.getProduct() != null ? inv.getProduct().getName() : "Unknown")
                            .warehouseId(inv.getWarehouse() != null ? inv.getWarehouse().getId() : null)
                            .warehouseName(inv.getWarehouse() != null ? inv.getWarehouse().getName() : "Unknown")
                            .availableQuantity(avail)
                            .reorderLevel(reorder)
                            .deficit(Math.max(0, reorder - avail))
                            .costPrice(inv.getProduct() != null ? inv.getProduct().getCostPrice() : BigDecimal.ZERO)
                            .sellingPrice(inv.getProduct() != null ? inv.getProduct().getSellingPrice() : BigDecimal.ZERO)
                            .build();
                })
                .collect(Collectors.toList());

        // 6. 7-day Sales vs Procurement Spend trend
        LocalDate today = LocalDate.now();
        LocalDate sevenDaysAgo = today.minusDays(6);
        Instant rangeStart = sevenDaysAgo.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant rangeEnd = today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        List<Order> ordersInRange = orderRepository.findByCreatedAtBetween(rangeStart, rangeEnd);
        List<PurchaseOrder> posInRange = purchaseOrderRepository.findByCreatedAtBetween(rangeStart, rangeEnd);

        Map<LocalDate, BigDecimal> salesByDate = new HashMap<>();
        Map<LocalDate, Long> orderCountByDate = new HashMap<>();
        for (Order o : ordersInRange) {
            if (o.getStatus() != OrderStatus.CANCELLED && o.getCreatedAt() != null) {
                LocalDate d = o.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
                salesByDate.merge(d, o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO, BigDecimal::add);
                orderCountByDate.merge(d, 1L, Long::sum);
            }
        }

        Map<LocalDate, BigDecimal> spendByDate = new HashMap<>();
        for (PurchaseOrder po : posInRange) {
            if (po.getStatus() != PurchaseOrderStatus.CANCELLED && po.getCreatedAt() != null) {
                LocalDate d = po.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
                spendByDate.merge(d, po.getTotalAmount() != null ? po.getTotalAmount() : BigDecimal.ZERO, BigDecimal::add);
            }
        }

        List<DailySalesVsSpendDto> dailySalesVsSpend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            dailySalesVsSpend.add(DailySalesVsSpendDto.builder()
                    .date(d)
                    .salesRevenue(salesByDate.getOrDefault(d, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP))
                    .procurementSpend(spendByDate.getOrDefault(d, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP))
                    .orderCount(orderCountByDate.getOrDefault(d, 0L))
                    .build());
        }

        return DashboardSummaryDto.builder()
                .totalProducts(totalProducts)
                .totalInventoryUnits(totalInventoryUnits)
                .totalValuation(totalValuation.setScale(2, RoundingMode.HALF_UP))
                .lowStockCount(lowStockCount)
                .pendingOrdersCount(pendingOrdersCount)
                .activeWarehousesCount(activeWarehousesCount)
                .stockPerWarehouse(stockPerWarehouse)
                .recentOrders(recentOrders)
                .criticalLowStockItems(criticalLowStockItems)
                .dailySalesVsSpend(dailySalesVsSpend)
                .build();
    }
}
