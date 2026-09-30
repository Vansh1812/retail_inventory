import apiClient from './axios';
import { ApiResponse } from '../types/api';
import {
  InventoryItem,
  InventoryTransaction,
  StockOperationFormData,
  StockAdjustmentFormData,
  StockTransferFormData,
} from '../types/inventory';
import { PageData } from '../types/admin';

export const fetchInventoryOverview = async (
  warehouseId?: number | '',
  search?: string,
  lowStockOnly?: boolean
): Promise<InventoryItem[]> => {
  const params: Record<string, string | number | boolean> = {};
  if (warehouseId !== undefined && warehouseId !== '') {
    params.warehouseId = warehouseId;
  }
  if (search && search.trim()) {
    params.search = search.trim();
  }
  if (lowStockOnly) {
    params.lowStockOnly = true;
  }

  const response = await apiClient.get<ApiResponse<InventoryItem[]>>('/inventory/overview', { params });
  return response.data.data;
};

export const fetchInventoryHistory = async (
  page: number = 0,
  size: number = 15,
  warehouseId?: number | '',
  productId?: number | '',
  type?: string
): Promise<PageData<InventoryTransaction>> => {
  const params: Record<string, string | number> = { page, size };
  if (warehouseId !== undefined && warehouseId !== '') {
    params.warehouseId = warehouseId;
  }
  if (productId !== undefined && productId !== '') {
    params.productId = productId;
  }
  if (type) {
    params.type = type;
  }

  const response = await apiClient.get<ApiResponse<PageData<InventoryTransaction>>>('/inventory/history', { params });
  return response.data.data;
};

export const stockIn = async (data: StockOperationFormData): Promise<InventoryItem> => {
  const payload = {
    ...data,
    productId: Number(data.productId),
    warehouseId: Number(data.warehouseId),
    quantity: Number(data.quantity),
  };
  const response = await apiClient.post<ApiResponse<InventoryItem>>('/inventory/stock-in', payload);
  return response.data.data;
};

export const stockOut = async (data: StockOperationFormData): Promise<InventoryItem> => {
  const payload = {
    ...data,
    productId: Number(data.productId),
    warehouseId: Number(data.warehouseId),
    quantity: Number(data.quantity),
  };
  const response = await apiClient.post<ApiResponse<InventoryItem>>('/inventory/stock-out', payload);
  return response.data.data;
};

export const adjustStock = async (data: StockAdjustmentFormData): Promise<InventoryItem> => {
  const payload = {
    ...data,
    productId: Number(data.productId),
    warehouseId: Number(data.warehouseId),
    newTotalQuantity: Number(data.newTotalQuantity),
  };
  const response = await apiClient.post<ApiResponse<InventoryItem>>('/inventory/adjust', payload);
  return response.data.data;
};

export const transferStock = async (data: StockTransferFormData): Promise<void> => {
  const payload = {
    ...data,
    sourceWarehouseId: Number(data.sourceWarehouseId),
    destinationWarehouseId: Number(data.destinationWarehouseId),
    productId: Number(data.productId),
    quantity: Number(data.quantity),
  };
  await apiClient.post<ApiResponse<void>>('/inventory/transfer', payload);
};
