package com.retail.inventory.analytics;

import com.retail.inventory.analytics.dto.InventoryReportRowDto;
import com.retail.inventory.analytics.dto.ProcurementReportDto;
import com.retail.inventory.analytics.dto.SalesReportDto;
import com.retail.inventory.analytics.dto.WarehouseUtilizationDto;
import com.retail.inventory.analytics.service.ReportService;
import com.retail.inventory.catalog.entity.Category;
import com.retail.inventory.catalog.entity.Product;
import com.retail.inventory.catalog.entity.ProductStatus;
import com.retail.inventory.inventory.entity.Inventory;
import com.retail.inventory.inventory.repository.InventoryRepository;
import com.retail.inventory.order.entity.Customer;
import com.retail.inventory.order.entity.Order;
import com.retail.inventory.order.entity.OrderItem;
import com.retail.inventory.order.entity.OrderStatus;
import com.retail.inventory.order.repository.OrderRepository;
import com.retail.inventory.order.service.OrderService;
import com.retail.inventory.procurement.entity.PurchaseOrder;
import com.retail.inventory.procurement.entity.PurchaseOrderStatus;
import com.retail.inventory.procurement.entity.Supplier;
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
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private WarehouseRepository warehouseRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private OrderService orderService;

    @InjectMocks
    private ReportService reportService;

    private Warehouse warehouse;
    private Product product;
    private Inventory inventory;

    @BeforeEach
    void setUp() {
        warehouse = Warehouse.builder()
                .name("Austin Depot")
                .city("Austin")
                .capacity(500)
                .status(WarehouseStatus.ACTIVE)
                .build();
        warehouse.setId(1L);

        Category category = Category.builder().name("Accessories").build();
        category.setId(1L);

        product = Product.builder()
                .sku("SKU-ACC-1")
                .name("Wireless Mouse")
                .category(category)
                .costPrice(new BigDecimal("20.00"))
                .sellingPrice(new BigDecimal("45.00"))
                .status(ProductStatus.ACTIVE)
                .build();
        product.setId(1L);

        inventory = Inventory.builder()
                .product(product)
                .warehouse(warehouse)
                .totalQuantity(100)
                .reservedQuantity(10)
                .reorderLevel(30)
                .build();
        inventory.setId(1L);
    }

    @Test
    void testGetInventoryReport() {
        when(inventoryRepository.findAll()).thenReturn(List.of(inventory));

        List<InventoryReportRowDto> report = reportService.getInventoryReport(null, null);

        assertNotNull(report);
        assertEquals(1, report.size());
        InventoryReportRowDto row = report.get(0);
        assertEquals("SKU-ACC-1", row.getSku());
        assertEquals(90, row.getAvailableQuantity());
        assertEquals("OPTIMAL", row.getReorderStatus());
        assertEquals(new BigDecimal("2000.00"), row.getAssetValue());
    }

    @Test
    void testGetSalesReport() {
        Customer customer = Customer.builder().name("John Doe").email("john@test.com").build();
        customer.setId(1L);

        Order order = Order.builder()
                .orderNumber("ORD-TEST-1")
                .customer(customer)
                .warehouse(warehouse)
                .status(OrderStatus.DELIVERED)
                .totalAmount(new BigDecimal("90.00"))
                .build();
        order.setId(1L);
        order.setCreatedAt(Instant.now());

        OrderItem item = OrderItem.builder()
                .order(order)
                .product(product)
                .quantity(2)
                .unitPrice(new BigDecimal("45.00"))
                .build();
        order.addItem(item);

        when(orderRepository.findByCreatedAtBetween(any(), any())).thenReturn(List.of(order));

        SalesReportDto salesReport = reportService.getSalesReport(LocalDate.now().minusDays(7), LocalDate.now(), null);

        assertNotNull(salesReport);
        assertEquals(new BigDecimal("90.00"), salesReport.getTotalRevenue());
        assertEquals(1L, salesReport.getTotalOrders());
        assertEquals(2L, salesReport.getTotalUnitsSold());
        assertEquals(1, salesReport.getTopProducts().size());
        assertEquals(2L, salesReport.getTopProducts().get(0).getUnitsSold());
    }

    @Test
    void testGetProcurementReport() {
        Supplier supplier = Supplier.builder().name("Tech Supplies Inc").build();
        supplier.setId(1L);

        PurchaseOrder po = PurchaseOrder.builder()
                .poNumber("PO-TEST-1")
                .supplier(supplier)
                .warehouse(warehouse)
                .status(PurchaseOrderStatus.RECEIVED)
                .totalAmount(new BigDecimal("1500.00"))
                .build();
        po.setId(1L);
        po.setCreatedAt(Instant.now());

        when(purchaseOrderRepository.findByCreatedAtBetween(any(), any())).thenReturn(List.of(po));

        ProcurementReportDto procReport = reportService.getProcurementReport(LocalDate.now().minusDays(7), LocalDate.now(), null);

        assertNotNull(procReport);
        assertEquals(new BigDecimal("1500.00"), procReport.getTotalSpend());
        assertEquals(1L, procReport.getTotalPurchaseOrders());
        assertEquals(1L, procReport.getReceivedOrdersCount());
        assertEquals(1, procReport.getSupplierBreakdown().size());
        assertEquals("Tech Supplies Inc", procReport.getSupplierBreakdown().get(0).getSupplierName());
    }

    @Test
    void testGetWarehouseUtilizationReport() {
        when(warehouseRepository.findAll()).thenReturn(List.of(warehouse));
        when(inventoryRepository.findAll()).thenReturn(List.of(inventory));

        List<WarehouseUtilizationDto> report = reportService.getWarehouseUtilizationReport();

        assertNotNull(report);
        assertEquals(1, report.size());
        WarehouseUtilizationDto whDto = report.get(0);
        assertEquals("Austin Depot", whDto.getWarehouseName());
        assertEquals(100L, whDto.getTotalUnits());
        assertEquals(500, whDto.getCapacity());
        assertEquals(20.0, whDto.getUtilizationPercentage());
        assertEquals(new BigDecimal("2000.00"), whDto.getTotalAssetValue());
    }
}
