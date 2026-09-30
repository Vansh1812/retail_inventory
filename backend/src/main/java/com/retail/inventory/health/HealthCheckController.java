package com.retail.inventory.health;

import com.retail.inventory.common.dto.ApiResponse;
import com.retail.inventory.common.exception.InsufficientStockException;
import com.retail.inventory.common.exception.ResourceNotFoundException;
import com.retail.inventory.common.exception.ValidationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
public class HealthCheckController {

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHealthStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "retail-inventory-system");
        status.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(ApiResponse.success(status, "Retail Inventory Backend is healthy and running"));
    }

    @GetMapping("/simulate-error")
    public ResponseEntity<ApiResponse<String>> simulateError(@RequestParam(defaultValue = "not_found") String type) {
        switch (type.toLowerCase()) {
            case "stock":
                throw new InsufficientStockException("SKU-WH-001", 10, 3);
            case "validation":
                throw new ValidationException("Invalid warehouse transfer payload: destination warehouse must differ from origin");
            case "server_error":
                throw new RuntimeException("Unexpected internal system fault");
            case "not_found":
            default:
                throw new ResourceNotFoundException("Warehouse", "code", "WH-NORTH-99");
        }
    }
}
