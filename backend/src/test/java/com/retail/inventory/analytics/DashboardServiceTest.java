package com.retail.inventory.analytics;

import com.retail.inventory.analytics.dto.DashboardSummaryDto;
import com.retail.inventory.analytics.service.DashboardService;
import com.retail.inventory.catalog.entity.Category;
import com.retail.inventory.catalog.entity.Product;
import com.retail.inventory.catalog.entity.ProductStatus;
import com.retail.inventory.catalog.repository.ProductRepository;
import com.retail.inventory.inventory.entity.Inventory;
import com.retail.inventory.inventory.repository.InventoryRepository;
import com.retail.inventory.order.entity.Customer;
import com.retail.inventory.order.entity.Order;
import com.retail.inventory.order.entity.OrderStatus;
import com.retail.inventory.order.repository.OrderRepository;
import com.retail.inventory.order.service.OrderService;
import com.retail.inventory.procurement.repository.PurchaseOrderRepository;
import com.retail.inventory.warehouse.entity.Warehouse;
import com.retail.inventory.warehouse.entity.WarehouseStatus;
import com.retail.inventory.warehouse.repository.WarehouseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private WarehouseRepository warehouseRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private OrderService orderService;

    @InjectMocks
    private DashboardService dashboardService;

    private Warehouse warehouse;
    private Product product;
    private Inventory inventory;

    @BeforeEach
    void setUp() {
        warehouse = Warehouse.builder()
                .name("Main Hub")
                .city("Dallas")
                .capacity(1000)
                .status(WarehouseStatus.ACTIVE)
                .build();
        warehouse.setId(1L);

        Category category = Category.builder().name("Electronics").build();
        category.setId(1L);

        product = Product.builder()
                .sku("SKU-100")
                .name("Smartphone")
                .category(category)
                .costPrice(new BigDecimal("300.00"))
                .sellingPrice(new BigDecimal("500.00"))
                .status(ProductStatus.ACTIVE)
                .build();
        product.setId(1L);

        inventory = Inventory.builder()
                .product(product)
                .warehouse(warehouse)
                .totalQuantity(50)
                .reservedQuantity(5)
                .reorderLevel(10)
                .build();
        inventory.setId(1L);
    }

    @Test
    void testGetDashboardSummary() {
        when(productRepository.countByStatus(ProductStatus.ACTIVE)).thenReturn(10L);
        when(warehouseRepository.countByStatus(WarehouseStatus.ACTIVE)).thenReturn(2L);
        when(orderRepository.countByStatusIn(any())).thenReturn(3L);
        when(inventoryRepository.findAll()).thenReturn(List.of(inventory));
        when(warehouseRepository.findAll()).thenReturn(List.of(warehouse));
        when(orderRepository.findTop5ByOrderByCreatedAtDesc()).thenReturn(Collections.emptyList());
        when(orderRepository.findByCreatedAtBetween(any(), any())).thenReturn(Collections.emptyList());
        when(purchaseOrderRepository.findByCreatedAtBetween(any(), any())).thenReturn(Collections.emptyList());

        DashboardSummaryDto summary = dashboardService.getDashboardSummary();

        assertNotNull(summary);
        assertEquals(10L, summary.getTotalProducts());
        assertEquals(2L, summary.getActiveWarehousesCount());
        assertEquals(3L, summary.getPendingOrdersCount());
        assertEquals(50L, summary.getTotalInventoryUnits());
        assertEquals(new BigDecimal("15000.00"), summary.getTotalValuation());
        assertEquals(0L, summary.getLowStockCount()); // 45 available > 10 reorderLevel
        assertEquals(1, summary.getStockPerWarehouse().size());
        assertEquals(5.0, summary.getStockPerWarehouse().get(0).getUtilizationPercentage());
    }
}
