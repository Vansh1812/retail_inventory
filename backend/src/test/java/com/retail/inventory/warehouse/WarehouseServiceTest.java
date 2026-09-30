package com.retail.inventory.warehouse;

import com.retail.inventory.admin.repository.AuditLogRepository;
import com.retail.inventory.common.exception.ResourceNotFoundException;
import com.retail.inventory.common.exception.ValidationException;
import com.retail.inventory.warehouse.dto.WarehouseDto;
import com.retail.inventory.warehouse.dto.WarehouseRequest;
import com.retail.inventory.warehouse.entity.Warehouse;
import com.retail.inventory.warehouse.entity.WarehouseStatus;
import com.retail.inventory.warehouse.repository.WarehouseRepository;
import com.retail.inventory.warehouse.service.WarehouseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WarehouseServiceTest {

    @Mock
    private WarehouseRepository warehouseRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private WarehouseService warehouseService;

    private Warehouse sampleWarehouse;

    @BeforeEach
    void setUp() {
        sampleWarehouse = Warehouse.builder()
                .name("Midwest Logistics Hub")
                .address("500 Hub Lane")
                .city("Chicago")
                .capacity(100000)
                .managerName("Alice Walker")
                .status(WarehouseStatus.ACTIVE)
                .build();
        sampleWarehouse.setId(1L);
    }

    @Test
    void testCreateWarehouseSuccess() {
        WarehouseRequest req = WarehouseRequest.builder()
                .name("Midwest Logistics Hub")
                .address("500 Hub Lane")
                .city("Chicago")
                .capacity(100000)
                .managerName("Alice Walker")
                .status(WarehouseStatus.ACTIVE)
                .build();

        when(warehouseRepository.existsByName("Midwest Logistics Hub")).thenReturn(false);
        when(warehouseRepository.save(any(Warehouse.class))).thenReturn(sampleWarehouse);

        WarehouseDto result = warehouseService.createWarehouse(req, "test_admin");

        assertNotNull(result);
        assertEquals("Midwest Logistics Hub", result.getName());
        assertEquals(WarehouseStatus.ACTIVE, result.getStatus());
        verify(warehouseRepository).save(any(Warehouse.class));
        verify(auditLogRepository).save(any());
    }

    @Test
    void testCreateWarehouseDuplicateNameThrowsValidationException() {
        WarehouseRequest req = WarehouseRequest.builder()
                .name("Midwest Logistics Hub")
                .address("500 Hub Lane")
                .city("Chicago")
                .capacity(100000)
                .managerName("Alice Walker")
                .status(WarehouseStatus.ACTIVE)
                .build();

        when(warehouseRepository.existsByName("Midwest Logistics Hub")).thenReturn(true);

        assertThrows(ValidationException.class, () -> warehouseService.createWarehouse(req, "test_admin"));
        verify(warehouseRepository, never()).save(any());
    }

    @Test
    void testGetWarehouseByIdSuccess() {
        when(warehouseRepository.findById(1L)).thenReturn(Optional.of(sampleWarehouse));

        WarehouseDto result = warehouseService.getWarehouseById(1L);
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Midwest Logistics Hub", result.getName());
    }

    @Test
    void testGetWarehouseByIdNotFoundThrowsException() {
        when(warehouseRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> warehouseService.getWarehouseById(999L));
    }

    @Test
    void testToggleWarehouseStatus() {
        when(warehouseRepository.findById(1L)).thenReturn(Optional.of(sampleWarehouse));
        when(warehouseRepository.save(any(Warehouse.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WarehouseDto toggled = warehouseService.updateWarehouseStatus(1L, null, "admin");

        assertEquals(WarehouseStatus.INACTIVE, toggled.getStatus());
        verify(auditLogRepository).save(any());
    }
}
