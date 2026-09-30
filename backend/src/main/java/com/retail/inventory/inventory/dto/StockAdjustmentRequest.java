package com.retail.inventory.inventory.dto;

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
public class StockAdjustmentRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Warehouse ID is required")
    private Long warehouseId;

    @NotNull(message = "New total quantity is required")
    @Min(value = 0, message = "New total quantity must be 0 or greater")
    private Integer newTotalQuantity;

    @NotBlank(message = "Reason for adjustment is mandatory for auditing")
    @Size(max = 255, message = "Reason cannot exceed 255 characters")
    private String reason;
}
