package com.retail.inventory.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispatchOrderRequest {

    @NotBlank(message = "Carrier is required")
    @Size(max = 100, message = "Carrier cannot exceed 100 characters")
    private String carrier;

    @NotBlank(message = "Tracking number is required")
    @Size(max = 100, message = "Tracking number cannot exceed 100 characters")
    private String trackingNumber;
}
