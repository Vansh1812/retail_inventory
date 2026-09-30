package com.retail.inventory.warehouse.dto;

import com.retail.inventory.warehouse.entity.WarehouseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseStatusRequest {
    private WarehouseStatus status;
}
