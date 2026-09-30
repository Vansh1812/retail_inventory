package com.retail.inventory.order;

import com.retail.inventory.admin.repository.AuditLogRepository;
import com.retail.inventory.catalog.entity.Product;
import com.retail.inventory.common.exception.ValidationException;
import com.retail.inventory.inventory.entity.Inventory;
import com.retail.inventory.inventory.entity.InventoryTransaction;
import com.retail.inventory.inventory.repository.InventoryRepository;
import com.retail.inventory.inventory.repository.InventoryTransactionRepository;
import com.retail.inventory.order.dto.DispatchOrderRequest;
import com.retail.inventory.order.dto.OrderDto;
import com.retail.inventory.order.entity.Customer;
import com.retail.inventory.order.entity.Order;
import com.retail.inventory.order.entity.OrderItem;
import com.retail.inventory.order.entity.OrderStatus;
import com.retail.inventory.order.entity.Shipment;
import com.retail.inventory.order.repository.OrderRepository;
import com.retail.inventory.order.repository.ShipmentRepository;
import com.retail.inventory.order.service.FulfillmentService;
import com.retail.inventory.order.service.OrderService;
import com.retail.inventory.warehouse.entity.Warehouse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FulfillmentServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ShipmentRepository shipmentRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private InventoryTransactionRepository transactionRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private OrderService orderService;

    @Mock
    private com.retail.inventory.notification.service.NotificationService notificationService;

    @InjectMocks
    private FulfillmentService fulfillmentService;

    private Customer sampleCustomer;
    private Warehouse sampleWarehouse;
    private Product sampleProduct;
    private Inventory sampleInventory;
    private Order sampleOrder;

    @BeforeEach
    void setUp() {
        sampleCustomer = Customer.builder().name("Bob Jones").email("bob@example.com").build();
        sampleCustomer.setId(10L);

        sampleWarehouse = Warehouse.builder().name("Central Logistics").build();
        sampleWarehouse.setId(1L);

        sampleProduct = Product.builder()
                .sku("SKU-ELEC-01")
                .name("Keyboard")
                .costPrice(new BigDecimal("20.00"))
                .sellingPrice(new BigDecimal("50.00"))
                .build();
        sampleProduct.setId(101L);

        sampleInventory = Inventory.builder()
                .product(sampleProduct)
                .warehouse(sampleWarehouse)
                .totalQuantity(30)
                .reservedQuantity(5)
                .build();
        sampleInventory.setId(201L);

        sampleOrder = Order.builder()
                .orderNumber("ORD-2026-FULF1")
                .customer(sampleCustomer)
                .warehouse(sampleWarehouse)
                .status(OrderStatus.CONFIRMED)
                .totalAmount(new BigDecimal("100.00"))
                .items(new ArrayList<>())
                .build();
        sampleOrder.setId(501L);

        OrderItem item = OrderItem.builder()
                .order(sampleOrder)
                .product(sampleProduct)
                .quantity(2)
                .unitPrice(new BigDecimal("50.00"))
                .build();
        item.setId(601L);
        sampleOrder.addItem(item);

        lenient().when(orderService.mapToDto(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            return OrderDto.builder()
                    .id(o.getId())
                    .orderNumber(o.getOrderNumber())
                    .status(o.getStatus())
                    .shipment(o.getShipment() != null ? com.retail.inventory.order.dto.ShipmentDto.builder()
                            .carrier(o.getShipment().getCarrier())
                            .trackingNumber(o.getShipment().getTrackingNumber())
                            .build() : null)
                    .build();
        });
    }

    @Test
    void testUpdateOrderStatus_stateMachineProgression() {
        when(orderRepository.findById(501L)).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        // CONFIRMED -> PROCESSING
        OrderDto processing = fulfillmentService.updateOrderStatus(501L, OrderStatus.PROCESSING, "staff");
        assertEquals(OrderStatus.PROCESSING, processing.getStatus());

        // PROCESSING -> PACKED
        sampleOrder.setStatus(OrderStatus.PROCESSING);
        OrderDto packed = fulfillmentService.updateOrderStatus(501L, OrderStatus.PACKED, "staff");
        assertEquals(OrderStatus.PACKED, packed.getStatus());

        // PACKED -> SHIPPED directly should fail
        sampleOrder.setStatus(OrderStatus.PACKED);
        assertThrows(ValidationException.class, () ->
                fulfillmentService.updateOrderStatus(501L, OrderStatus.SHIPPED, "staff"));
    }

    @Test
    void testDispatchOrder_deductsPhysicalAndReservedStock() {
        sampleOrder.setStatus(OrderStatus.PACKED);
        when(orderRepository.findById(501L)).thenReturn(Optional.of(sampleOrder));
        when(inventoryRepository.findForUpdate(101L, 1L)).thenReturn(Optional.of(sampleInventory));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(shipmentRepository.save(any(Shipment.class))).thenAnswer(inv -> inv.getArgument(0));

        DispatchOrderRequest request = DispatchOrderRequest.builder()
                .carrier("FedEx")
                .trackingNumber("FDX-99887766")
                .build();

        OrderDto dispatched = fulfillmentService.dispatchOrder(501L, request, "staff");

        assertNotNull(dispatched);
        assertEquals(OrderStatus.SHIPPED, dispatched.getStatus());
        assertNotNull(dispatched.getShipment());
        assertEquals("FDX-99887766", dispatched.getShipment().getTrackingNumber());

        // Stock deduction check:
        // Total was 30, dispatched 2 -> new total = 28
        // Reserved was 5, released 2 from reservation -> new reserved = 3
        assertEquals(28, sampleInventory.getTotalQuantity());
        assertEquals(3, sampleInventory.getReservedQuantity());
        assertEquals(25, sampleInventory.getAvailableQuantity()); // 28 - 3

        verify(inventoryRepository, times(1)).save(sampleInventory);
        verify(transactionRepository, times(1)).save(any(InventoryTransaction.class));
        verify(shipmentRepository, times(1)).save(any(Shipment.class));
    }
}
