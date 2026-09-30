package com.retail.inventory.warehouse.dto;

import com.retail.inventory.warehouse.entity.WarehouseStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseRequest {

    @NotBlank(message = "Warehouse name is required")
    @Size(min = 2, max = 120, message = "Warehouse name must be between 2 and 120 characters")
    private String name;

    @NotBlank(message = "Address is required")
    @Size(max = 255, message = "Address must not exceed 255 characters")
    private String address;

    @NotBlank(message = "City is required")
    @Size(min = 2, max = 100, message = "City must be between 2 and 100 characters")
    private String city;

    @NotNull(message = "Capacity is required")
    @Min(value = 0, message = "Capacity must be non-negative")
    private Integer capacity;

    @Size(max = 100, message = "Manager name must not exceed 100 characters")
    private String managerName;

    @Builder.Default
    private WarehouseStatus status = WarehouseStatus.ACTIVE;
}
