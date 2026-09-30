package com.retail.inventory.inventory;

import com.retail.inventory.admin.repository.AuditLogRepository;
import com.retail.inventory.catalog.entity.Category;
import com.retail.inventory.catalog.entity.Product;
import com.retail.inventory.catalog.entity.ProductStatus;
import com.retail.inventory.catalog.repository.ProductRepository;
import com.retail.inventory.common.exception.InsufficientStockException;
import com.retail.inventory.common.exception.ValidationException;
import com.retail.inventory.inventory.dto.InventoryDto;
import com.retail.inventory.inventory.entity.Inventory;
import com.retail.inventory.inventory.entity.InventoryTransaction;
import com.retail.inventory.inventory.repository.InventoryRepository;
import com.retail.inventory.inventory.repository.InventoryTransactionRepository;
import com.retail.inventory.inventory.service.InventoryService;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private InventoryTransactionRepository transactionRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private WarehouseRepository warehouseRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private com.retail.inventory.notification.service.NotificationService notificationService;

    @InjectMocks
    private InventoryService inventoryService;

    private Product sampleProduct;
    private Warehouse sampleWarehouse;
    private Inventory sampleInventory;

    @BeforeEach
    void setUp() {
        Category cat = Category.builder().name("Electronics").build();
        cat.setId(1L);

        sampleProduct = Product.builder()
                .sku("SKU-TEST-100")
                .name("Test Laptop")
                .category(cat)
                .costPrice(new BigDecimal("500"))
                .sellingPrice(new BigDecimal("800"))
                .reorderLevel(10)
                .status(ProductStatus.ACTIVE)
                .build();
        sampleProduct.setId(10L);

        sampleWarehouse = Warehouse.builder()
                .name("Main Logistics Hub")
                .address("100 Industrial Pkwy")
                .city("Chicago")
                .capacity(100000)
                .status(WarehouseStatus.ACTIVE)
                .build();
        sampleWarehouse.setId(20L);

        sampleInventory = Inventory.builder()
                .product(sampleProduct)
                .warehouse(sampleWarehouse)
                .totalQuantity(50)
                .reservedQuantity(10)
                .reorderLevel(10)
                .build();
        sampleInventory.setId(100L);
    }

    @Test
    void testStockInSuccess() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(warehouseRepository.findById(20L)).thenReturn(Optional.of(sampleWarehouse));
        when(inventoryRepository.findForUpdate(10L, 20L)).thenReturn(Optional.of(sampleInventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));

        InventoryDto result = inventoryService.stockIn(10L, 20L, 25, "Restock batch", "PO-1001", "inv_mgr");

        assertNotNull(result);
        assertEquals(75, result.getTotalQuantity());
        assertEquals(65, result.getAvailableQuantity()); // 75 - 10
        verify(transactionRepository).save(any(InventoryTransaction.class));
        verify(auditLogRepository).save(any());
    }

    @Test
    void testStockOutSuccess() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(warehouseRepository.findById(20L)).thenReturn(Optional.of(sampleWarehouse));
        when(inventoryRepository.findForUpdate(10L, 20L)).thenReturn(Optional.of(sampleInventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));

        // Available is 50 - 10 = 40. Request 20.
        InventoryDto result = inventoryService.stockOut(10L, 20L, 20, "Store dispatch", "SO-500", "inv_mgr");

        assertNotNull(result);
        assertEquals(30, result.getTotalQuantity());
        assertEquals(20, result.getAvailableQuantity()); // 30 - 10
        verify(transactionRepository).save(any(InventoryTransaction.class));
        verify(auditLogRepository).save(any());
    }

    @Test
    void testStockOutInsufficientStockThrowsException() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(warehouseRepository.findById(20L)).thenReturn(Optional.of(sampleWarehouse));
        when(inventoryRepository.findForUpdate(10L, 20L)).thenReturn(Optional.of(sampleInventory));

        // Available is 40. Request 45.
        assertThrows(InsufficientStockException.class, () ->
                inventoryService.stockOut(10L, 20L, 45, "Excessive dispatch", "SO-501", "inv_mgr")
        );
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void testAdjustStockSuccess() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(warehouseRepository.findById(20L)).thenReturn(Optional.of(sampleWarehouse));
        when(inventoryRepository.findForUpdate(10L, 20L)).thenReturn(Optional.of(sampleInventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));

        InventoryDto result = inventoryService.adjustStock(10L, 20L, 60, "Physical stock audit count", "admin");

        assertNotNull(result);
        assertEquals(60, result.getTotalQuantity());
        assertEquals(50, result.getAvailableQuantity()); // 60 - 10
        verify(transactionRepository).save(any(InventoryTransaction.class));
    }

    @Test
    void testAdjustStockBelowReservedThrowsException() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(warehouseRepository.findById(20L)).thenReturn(Optional.of(sampleWarehouse));
        when(inventoryRepository.findForUpdate(10L, 20L)).thenReturn(Optional.of(sampleInventory));

        // Reserved is 10. Attempt adjust to 5.
        assertThrows(ValidationException.class, () ->
                inventoryService.adjustStock(10L, 20L, 5, "Audit count error", "admin")
        );
    }
}
