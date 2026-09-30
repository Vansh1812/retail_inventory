package com.retail.inventory.procurement;

import com.retail.inventory.admin.repository.AuditLogRepository;
import com.retail.inventory.catalog.entity.Product;
import com.retail.inventory.catalog.repository.ProductRepository;
import com.retail.inventory.common.exception.ValidationException;
import com.retail.inventory.inventory.service.InventoryService;
import com.retail.inventory.procurement.dto.PurchaseOrderDto;
import com.retail.inventory.procurement.dto.PurchaseOrderItemRequest;
import com.retail.inventory.procurement.dto.PurchaseOrderRequest;
import com.retail.inventory.procurement.entity.PurchaseOrder;
import com.retail.inventory.procurement.entity.PurchaseOrderItem;
import com.retail.inventory.procurement.entity.PurchaseOrderStatus;
import com.retail.inventory.procurement.entity.Supplier;
import com.retail.inventory.procurement.repository.PurchaseOrderRepository;
import com.retail.inventory.procurement.repository.SupplierRepository;
import com.retail.inventory.procurement.service.ProcurementService;
import com.retail.inventory.warehouse.entity.Warehouse;
import com.retail.inventory.warehouse.repository.WarehouseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProcurementServiceTest {

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private WarehouseRepository warehouseRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private com.retail.inventory.notification.service.NotificationService notificationService;

    @InjectMocks
    private ProcurementService procurementService;

    private Supplier sampleSupplier;
    private Warehouse sampleWarehouse;
    private Product sampleProduct;
    private PurchaseOrder samplePo;

    @BeforeEach
    void setUp() {
        sampleSupplier = Supplier.builder().name("Apex Tech").build();
        sampleSupplier.setId(1L);

        sampleWarehouse = Warehouse.builder().name("East Hub").city("Newark").build();
        sampleWarehouse.setId(2L);

        sampleProduct = Product.builder().sku("SKU-100").name("Widget").build();
        sampleProduct.setId(3L);

        samplePo = PurchaseOrder.builder()
                .poNumber("PO-TEST-001")
                .supplier(sampleSupplier)
                .warehouse(sampleWarehouse)
                .status(PurchaseOrderStatus.SUBMITTED)
                .totalAmount(new BigDecimal("1000.00"))
                .items(new ArrayList<>())
                .build();
        samplePo.setId(10L);

        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .purchaseOrder(samplePo)
                .product(sampleProduct)
                .quantity(10)
                .unitCost(new BigDecimal("100.00"))
                .build();
        samplePo.addItem(item);
    }

    @Test
    void testReceiveGoodsReplenishesInventoryAndMarksReceived() {
        when(purchaseOrderRepository.findById(10L)).thenReturn(Optional.of(samplePo));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));

        PurchaseOrderDto result = procurementService.receiveGoods(10L, "proc_mgr");

        assertNotNull(result);
        assertEquals(PurchaseOrderStatus.RECEIVED, result.getStatus());
        verify(inventoryService, times(1)).stockIn(
                eq(3L),
                eq(2L),
                eq(10),
                contains("PO-TEST-001"),
                eq("PO-TEST-001"),
                eq("proc_mgr")
        );
        verify(auditLogRepository).save(any());
    }

    @Test
    void testReceiveGoodsOnDraftThrowsValidationException() {
        samplePo.setStatus(PurchaseOrderStatus.DRAFT);
        when(purchaseOrderRepository.findById(10L)).thenReturn(Optional.of(samplePo));

        assertThrows(ValidationException.class, () -> procurementService.receiveGoods(10L, "proc_mgr"));
        verify(inventoryService, never()).stockIn(any(), any(), any(), any(), any(), any());
    }
}
