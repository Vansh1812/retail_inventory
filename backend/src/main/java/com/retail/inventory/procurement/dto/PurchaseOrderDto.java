package com.retail.inventory.procurement.dto;

import com.retail.inventory.procurement.entity.PurchaseOrder;
import com.retail.inventory.procurement.entity.PurchaseOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderDto {
    private Long id;
    private String poNumber;
    private Long supplierId;
    private String supplierName;
    private Long warehouseId;
    private String warehouseName;
    private String warehouseCity;
    private PurchaseOrderStatus status;
    private BigDecimal totalAmount;
    private String notes;
    private List<PurchaseOrderItemDto> items;
    private Instant createdAt;
    private Instant updatedAt;

    public static PurchaseOrderDto fromEntity(PurchaseOrder po) {
        List<PurchaseOrderItemDto> itemDtos = po.getItems() != null
                ? po.getItems().stream().map(PurchaseOrderItemDto::fromEntity).toList()
                : List.of();

        return PurchaseOrderDto.builder()
                .id(po.getId())
                .poNumber(po.getPoNumber())
                .supplierId(po.getSupplier().getId())
                .supplierName(po.getSupplier().getName())
                .warehouseId(po.getWarehouse().getId())
                .warehouseName(po.getWarehouse().getName())
                .warehouseCity(po.getWarehouse().getCity())
                .status(po.getStatus())
                .totalAmount(po.getTotalAmount())
                .notes(po.getNotes())
                .items(itemDtos)
                .createdAt(po.getCreatedAt())
                .updatedAt(po.getUpdatedAt())
                .build();
    }
}
