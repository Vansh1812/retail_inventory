package com.retail.inventory.analytics.controller;

import com.retail.inventory.analytics.dto.InventoryReportRowDto;
import com.retail.inventory.analytics.dto.ProcurementReportDto;
import com.retail.inventory.analytics.dto.SalesReportDto;
import com.retail.inventory.analytics.dto.WarehouseUtilizationDto;
import com.retail.inventory.analytics.service.ReportService;
import com.retail.inventory.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/inventory")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER')")
    public ResponseEntity<ApiResponse<List<InventoryReportRowDto>>> getInventoryReport(
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long categoryId
    ) {
        List<InventoryReportRowDto> report = reportService.getInventoryReport(warehouseId, categoryId);
        return ResponseEntity.ok(ApiResponse.success(report, "Inventory report generated successfully"));
    }

    @GetMapping("/sales")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER')")
    public ResponseEntity<ApiResponse<SalesReportDto>> getSalesReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long warehouseId
    ) {
        SalesReportDto report = reportService.getSalesReport(startDate, endDate, warehouseId);
        return ResponseEntity.ok(ApiResponse.success(report, "Sales report generated successfully"));
    }

    @GetMapping("/procurement")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROCUREMENT_MANAGER')")
    public ResponseEntity<ApiResponse<ProcurementReportDto>> getProcurementReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long supplierId
    ) {
        ProcurementReportDto report = reportService.getProcurementReport(startDate, endDate, supplierId);
        return ResponseEntity.ok(ApiResponse.success(report, "Procurement report generated successfully"));
    }

    @GetMapping("/warehouse-utilization")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER', 'INVENTORY_MANAGER')")
    public ResponseEntity<ApiResponse<List<WarehouseUtilizationDto>>> getWarehouseUtilizationReport() {
        List<WarehouseUtilizationDto> report = reportService.getWarehouseUtilizationReport();
        return ResponseEntity.ok(ApiResponse.success(report, "Warehouse utilization report generated successfully"));
    }
}
