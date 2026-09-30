import apiClient from './axios';
import { ApiResponse } from '../types/api';
import { Order } from '../types/order';
import { PurchaseOrder } from '../types/procurement';

export interface InventoryReportRow {
  productId: number;
  sku: string;
  productName: string;
  categoryName: string;
  warehouseId: number;
  warehouseName: string;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  costPrice: number;
  sellingPrice: number;
  assetValue: number;
  reorderStatus: 'OUT_OF_STOCK' | 'CRITICAL_LOW' | 'LOW' | 'OPTIMAL';
}

export interface TopSellingProduct {
  productId: number;
  sku: string;
  productName: string;
  unitsSold: number;
  totalSales: number;
}

export interface DailySalesMetric {
  date: string;
  salesRevenue: number;
  procurementSpend: number;
  orderCount: number;
}

export interface SalesReport {
  totalRevenue: number;
  totalOrders: number;
  totalUnitsSold: number;
  averageOrderValue: number;
  topProducts: TopSellingProduct[];
  dailyBreakdown: DailySalesMetric[];
  orders: Order[];
}

export interface SupplierSpend {
  supplierId: number;
  supplierName: string;
  poCount: number;
  totalSpend: number;
}

export interface ProcurementReport {
  totalSpend: number;
  totalPurchaseOrders: number;
  receivedOrdersCount: number;
  pendingOrdersCount: number;
  statusBreakdown: Record<string, number>;
  supplierBreakdown: SupplierSpend[];
  purchaseOrders: PurchaseOrder[];
}

export interface WarehouseUtilization {
  warehouseId: number;
  warehouseName: string;
  city: string;
  capacity: number;
  totalUnits: number;
  utilizationPercentage: number;
  totalAssetValue: number;
  lowStockSkuCount: number;
  status: string;
}

export const fetchInventoryReport = async (
  warehouseId?: number,
  categoryId?: number
): Promise<InventoryReportRow[]> => {
  const params: Record<string, string> = {};
  if (warehouseId) params.warehouseId = warehouseId.toString();
  if (categoryId) params.categoryId = categoryId.toString();

  const response = await apiClient.get<ApiResponse<InventoryReportRow[]>>('/reports/inventory', { params });
  return response.data.data;
};

export const fetchSalesReport = async (
  startDate?: string,
  endDate?: string,
  warehouseId?: number
): Promise<SalesReport> => {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (warehouseId) params.warehouseId = warehouseId.toString();

  const response = await apiClient.get<ApiResponse<SalesReport>>('/reports/sales', { params });
  return response.data.data;
};

export const fetchProcurementReport = async (
  startDate?: string,
  endDate?: string,
  supplierId?: number
): Promise<ProcurementReport> => {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (supplierId) params.supplierId = supplierId.toString();

  const response = await apiClient.get<ApiResponse<ProcurementReport>>('/reports/procurement', { params });
  return response.data.data;
};

export const fetchWarehouseUtilizationReport = async (): Promise<WarehouseUtilization[]> => {
  const response = await apiClient.get<ApiResponse<WarehouseUtilization[]>>('/reports/warehouse-utilization');
  return response.data.data;
};
