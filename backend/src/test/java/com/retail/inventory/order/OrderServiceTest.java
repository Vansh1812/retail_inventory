package com.retail.inventory.order;

import com.retail.inventory.admin.repository.AuditLogRepository;
import com.retail.inventory.catalog.entity.Category;
import com.retail.inventory.catalog.entity.Product;
import com.retail.inventory.catalog.entity.ProductStatus;
import com.retail.inventory.catalog.repository.ProductRepository;
import com.retail.inventory.common.exception.InsufficientStockException;
import com.retail.inventory.common.exception.ValidationException;
import com.retail.inventory.inventory.entity.Inventory;
import com.retail.inventory.inventory.entity.InventoryTransaction;
import com.retail.inventory.inventory.repository.InventoryRepository;
import com.retail.inventory.inventory.repository.InventoryTransactionRepository;
import com.retail.inventory.order.dto.CreateOrderItemRequest;
import com.retail.inventory.order.dto.CreateOrderRequest;
import com.retail.inventory.order.dto.OrderDto;
import com.retail.inventory.order.entity.Customer;
import com.retail.inventory.order.entity.Order;
import com.retail.inventory.order.entity.OrderItem;
import com.retail.inventory.order.entity.OrderStatus;
import com.retail.inventory.order.repository.CustomerRepository;
import com.retail.inventory.order.repository.OrderRepository;
import com.retail.inventory.order.service.OrderService;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private WarehouseRepository warehouseRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private InventoryTransactionRepository transactionRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private com.retail.inventory.notification.service.NotificationService notificationService;

    @InjectMocks
    private OrderService orderService;

    private Customer sampleCustomer;
    private Warehouse sampleWarehouse;
    private Product sampleProduct;
    private Inventory sampleInventory;
    private Order sampleOrder;

    @BeforeEach
    void setUp() {
        sampleCustomer = Customer.builder()
                .name("Alice Smith")
                .email("alice@example.com")
                .build();
        sampleCustomer.setId(10L);

        sampleWarehouse = Warehouse.builder()
                .name("Main Hub")
                .city("Chicago")
                .capacity(10000)
                .status(WarehouseStatus.ACTIVE)
                .build();
        sampleWarehouse.setId(1L);

        sampleProduct = Product.builder()
                .sku("SKU-TEST-001")
                .name("Wireless Mouse")
                .costPrice(new BigDecimal("15.00"))
                .sellingPrice(new BigDecimal("30.00"))
                .status(ProductStatus.ACTIVE)
                .build();
        sampleProduct.setId(101L);

        sampleInventory = Inventory.builder()
                .product(sampleProduct)
                .warehouse(sampleWarehouse)
                .totalQuantity(50)
                .reservedQuantity(10)
                .reorderLevel(5)
                .build();
        sampleInventory.setId(201L);

        sampleOrder = Order.builder()
                .orderNumber("ORD-2026-TEST1")
                .customer(sampleCustomer)
                .warehouse(sampleWarehouse)
                .status(OrderStatus.PENDING)
                .totalAmount(new BigDecimal("60.00"))
                .items(new ArrayList<>())
                .build();
        sampleOrder.setId(501L);

        OrderItem item = OrderItem.builder()
                .order(sampleOrder)
                .product(sampleProduct)
                .quantity(2)
                .unitPrice(new BigDecimal("30.00"))
                .build();
        item.setId(601L);
        sampleOrder.addItem(item);
    }

    @Test
    void testCreateOrder_success() {
        when(customerRepository.findById(10L)).thenReturn(Optional.of(sampleCustomer));
        when(warehouseRepository.findById(1L)).thenReturn(Optional.of(sampleWarehouse));
        when(productRepository.findById(101L)).thenReturn(Optional.of(sampleProduct));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(502L);
            return o;
        });

        CreateOrderRequest request = CreateOrderRequest.builder()
                .customerId(10L)
                .warehouseId(1L)
                .items(List.of(CreateOrderItemRequest.builder()
                        .productId(101L)
                        .quantity(2)
                        .unitPrice(new BigDecimal("30.00"))
                        .build()))
                .build();

        OrderDto dto = orderService.createOrder(request, "admin");

        assertNotNull(dto);
        assertEquals(OrderStatus.PENDING, dto.getStatus());
        assertEquals(new BigDecimal("60.00"), dto.getTotalAmount());
        assertEquals(1, dto.getItems().size());
        verify(orderRepository, times(1)).save(any(Order.class));
    }

    @Test
    void testConfirmOrder_success_reservesStock() {
        when(orderRepository.findById(501L)).thenReturn(Optional.of(sampleOrder));
        when(inventoryRepository.findForUpdate(101L, 1L)).thenReturn(Optional.of(sampleInventory));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderDto confirmed = orderService.confirmOrder(501L, "admin");

        assertNotNull(confirmed);
        assertEquals(OrderStatus.CONFIRMED, confirmed.getStatus());
        assertEquals(12, sampleInventory.getReservedQuantity()); // 10 + 2
        assertEquals(38, sampleInventory.getAvailableQuantity()); // 50 - 12
        verify(inventoryRepository, times(1)).save(sampleInventory);
        verify(transactionRepository, times(1)).save(any(InventoryTransaction.class));
    }

    @Test
    void testConfirmOrder_insufficientStock_throwsException() {
        sampleInventory.setTotalQuantity(10);
        sampleInventory.setReservedQuantity(9); // available = 1, required = 2
        when(orderRepository.findById(501L)).thenReturn(Optional.of(sampleOrder));
        when(inventoryRepository.findForUpdate(101L, 1L)).thenReturn(Optional.of(sampleInventory));

        assertThrows(InsufficientStockException.class, () -> orderService.confirmOrder(501L, "admin"));
        assertEquals(OrderStatus.PENDING, sampleOrder.getStatus());
        verify(transactionRepository, never()).save(any(InventoryTransaction.class));
    }

    @Test
    void testCancelOrder_confirmed_releasesReservation() {
        sampleOrder.setStatus(OrderStatus.CONFIRMED);
        sampleInventory.setReservedQuantity(12);

        when(orderRepository.findById(501L)).thenReturn(Optional.of(sampleOrder));
        when(inventoryRepository.findForUpdate(101L, 1L)).thenReturn(Optional.of(sampleInventory));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderDto cancelled = orderService.cancelOrder(501L, "admin");

        assertNotNull(cancelled);
        assertEquals(OrderStatus.CANCELLED, cancelled.getStatus());
        assertEquals(10, sampleInventory.getReservedQuantity()); // 12 - 2
        verify(transactionRepository, times(1)).save(any(InventoryTransaction.class));
    }
}
