import apiClient from './axios';
import { ApiResponse } from '../types/api';
import { Order } from '../types/order';

export interface WarehouseStockSummary {
  warehouseId: number;
  warehouseName: string;
  city: string;
  capacity: number;
  totalUnits: number;
  totalValuation: number;
  utilizationPercentage: number;
}

export interface CriticalLowStockItem {
  productId: number;
  sku: string;
  productName: string;
  warehouseId: number;
  warehouseName: string;
  availableQuantity: number;
  reorderLevel: number;
  deficit: number;
  costPrice: number;
  sellingPrice: number;
}

export interface DailySalesVsSpend {
  date: string;
  salesRevenue: number;
  procurementSpend: number;
  orderCount: number;
}

export interface DashboardSummary {
  totalProducts: number;
  totalInventoryUnits: number;
  totalValuation: number;
  lowStockCount: number;
  pendingOrdersCount: number;
  activeWarehousesCount: number;
  stockPerWarehouse: WarehouseStockSummary[];
  recentOrders: Order[];
  criticalLowStockItems: CriticalLowStockItem[];
  dailySalesVsSpend: DailySalesVsSpend[];
}

export const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
  return response.data.data;
};
