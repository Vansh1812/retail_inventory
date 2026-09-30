package com.retail.inventory.common.exception;

import com.retail.inventory.common.dto.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    void testHandleResourceNotFound() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Product", "id", 101L);
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleResourceNotFound(ex);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Product not found with id: '101'", response.getBody().getMessage());
        assertNotNull(response.getBody().getTimestamp());
    }

    @Test
    void testHandleInsufficientStock() {
        InsufficientStockException ex = new InsufficientStockException("SKU-ITEM-10", 5, 2);
        ResponseEntity<ApiResponse<Map<String, Object>>> response = exceptionHandler.handleInsufficientStock(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertTrue(response.getBody().getMessage().contains("Insufficient stock"));
        assertNotNull(response.getBody().getData());
        assertEquals("SKU-ITEM-10", response.getBody().getData().get("sku"));
        assertEquals(5, response.getBody().getData().get("requestedQuantity"));
        assertEquals(2, response.getBody().getData().get("availableQuantity"));
    }

    @Test
    void testHandleValidationException() {
        ValidationException ex = new ValidationException("Invalid warehouse location");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleValidationException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Invalid warehouse location", response.getBody().getMessage());
    }

    @Test
    void testHandleAccessDenied() {
        org.springframework.security.access.AccessDeniedException ex = new org.springframework.security.access.AccessDeniedException("Access is denied");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleAccessDenied(ex);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertTrue(response.getBody().getMessage().contains("Access denied"));
    }

    @Test
    void testHandleGlobalException() {
        Exception ex = new RuntimeException("Database timeout");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleGlobalException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertTrue(response.getBody().getMessage().contains("internal server error"));
    }
}
