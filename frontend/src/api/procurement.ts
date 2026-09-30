import apiClient from './axios';
import { ApiResponse } from '../types/api';
import { PageData } from '../types/admin';
import {
  Supplier,
  SupplierFormData,
  SupplierStatus,
  PurchaseOrder,
  PurchaseOrderFormData,
  PurchaseOrderStatus,
} from '../types/procurement';

// Suppliers API
export const fetchSuppliers = async (
  status?: SupplierStatus | '',
  search?: string
): Promise<Supplier[]> => {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (search && search.trim()) params.search = search.trim();

  const response = await apiClient.get<ApiResponse<Supplier[]>>('/suppliers', { params });
  return response.data.data;
};

export const fetchSupplierById = async (id: number): Promise<Supplier> => {
  const response = await apiClient.get<ApiResponse<Supplier>>(`/suppliers/${id}`);
  return response.data.data;
};

export const createSupplier = async (data: SupplierFormData): Promise<Supplier> => {
  const response = await apiClient.post<ApiResponse<Supplier>>('/suppliers', data);
  return response.data.data;
};

export const updateSupplier = async (id: number, data: SupplierFormData): Promise<Supplier> => {
  const response = await apiClient.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data);
  return response.data.data;
};

export const toggleSupplierStatus = async (id: number): Promise<Supplier> => {
  const response = await apiClient.put<ApiResponse<Supplier>>(`/suppliers/${id}/status`);
  return response.data.data;
};

// Purchase Orders API
export const fetchPurchaseOrders = async (
  page: number = 0,
  size: number = 10,
  status?: PurchaseOrderStatus | '',
  warehouseId?: number | '',
  supplierId?: number | '',
  search?: string
): Promise<PageData<PurchaseOrder>> => {
  const params: Record<string, string | number> = { page, size };
  if (status) params.status = status;
  if (warehouseId !== undefined && warehouseId !== '') params.warehouseId = warehouseId;
  if (supplierId !== undefined && supplierId !== '') params.supplierId = supplierId;
  if (search && search.trim()) params.search = search.trim();

  const response = await apiClient.get<ApiResponse<PageData<PurchaseOrder>>>('/purchase-orders', { params });
  return response.data.data;
};

export const fetchPurchaseOrderById = async (id: number): Promise<PurchaseOrder> => {
  const response = await apiClient.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`);
  return response.data.data;
};

export const createPurchaseOrder = async (data: PurchaseOrderFormData): Promise<PurchaseOrder> => {
  const payload = {
    supplierId: Number(data.supplierId),
    warehouseId: Number(data.warehouseId),
    notes: data.notes,
    items: data.items.map((it) => ({
      productId: Number(it.productId),
      quantity: Number(it.quantity),
      unitCost: Number(it.unitCost),
    })),
  };
  const response = await apiClient.post<ApiResponse<PurchaseOrder>>('/purchase-orders', payload);
  return response.data.data;
};

export const submitPurchaseOrder = async (id: number): Promise<PurchaseOrder> => {
  const response = await apiClient.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/submit`);
  return response.data.data;
};

export const receiveGoods = async (id: number): Promise<PurchaseOrder> => {
  const response = await apiClient.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/receive`);
  return response.data.data;
};

export const cancelPurchaseOrder = async (id: number, reason?: string): Promise<PurchaseOrder> => {
  const response = await apiClient.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/cancel`, { reason });
  return response.data.data;
};
