package com.retail.inventory.common.exception;

import lombok.Getter;

@Getter
public class InsufficientStockException extends RuntimeException {

    private final String sku;
    private final Integer requestedQuantity;
    private final Integer availableQuantity;

    public InsufficientStockException(String message) {
        super(message);
        this.sku = null;
        this.requestedQuantity = null;
        this.availableQuantity = null;
    }

    public InsufficientStockException(String sku, Integer requestedQuantity, Integer availableQuantity) {
        super(String.format("Insufficient stock for SKU '%s'. Requested: %d, Available: %d",
                sku, requestedQuantity, availableQuantity));
        this.sku = sku;
        this.requestedQuantity = requestedQuantity;
        this.availableQuantity = availableQuantity;
    }
}
