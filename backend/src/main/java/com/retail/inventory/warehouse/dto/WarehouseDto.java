package com.retail.inventory.warehouse.dto;

import com.retail.inventory.warehouse.entity.Warehouse;
import com.retail.inventory.warehouse.entity.WarehouseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseDto {
    private Long id;
    private String name;
    private String address;
    private String city;
    private Integer capacity;
    private String managerName;
    private WarehouseStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    public static WarehouseDto fromEntity(Warehouse warehouse) {
        return WarehouseDto.builder()
                .id(warehouse.getId())
                .name(warehouse.getName())
                .address(warehouse.getAddress())
                .city(warehouse.getCity())
                .capacity(warehouse.getCapacity())
                .managerName(warehouse.getManagerName())
                .status(warehouse.getStatus())
                .createdAt(warehouse.getCreatedAt())
                .updatedAt(warehouse.getUpdatedAt())
                .build();
    }
}
