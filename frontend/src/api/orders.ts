import apiClient from './axios';
import { ApiResponse } from '../types/api';
import { PageData } from '../types/admin';
import { Order, CreateOrderFormData, OrderStatus } from '../types/order';

export const fetchOrders = async (
  page: number = 0,
  size: number = 10,
  status?: OrderStatus | '',
  warehouseId?: number | '',
  customerId?: number | '',
  search?: string
): Promise<PageData<Order>> => {
  const params: Record<string, string | number> = { page, size };
  if (status) params.status = status;
  if (warehouseId !== undefined && warehouseId !== '') params.warehouseId = warehouseId;
  if (customerId !== undefined && customerId !== '') params.customerId = customerId;
  if (search && search.trim()) params.search = search.trim();

  const response = await apiClient.get<ApiResponse<PageData<Order>>>('/orders', { params });
  return response.data.data;
};

export const fetchOrderById = async (id: number): Promise<Order> => {
  const response = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
  return response.data.data;
};

export const createOrder = async (data: CreateOrderFormData): Promise<Order> => {
  const payload = {
    customerId: Number(data.customerId),
    warehouseId: Number(data.warehouseId),
    notes: data.notes,
    items: data.items.map(item => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity),
      unitPrice: item.unitPrice !== undefined ? Number(item.unitPrice) : undefined,
    })),
  };
  const response = await apiClient.post<ApiResponse<Order>>('/orders', payload);
  return response.data.data;
};

export const confirmOrder = async (id: number): Promise<Order> => {
  const response = await apiClient.put<ApiResponse<Order>>(`/orders/${id}/confirm`);
  return response.data.data;
};

export const cancelOrder = async (id: number): Promise<Order> => {
  const response = await apiClient.put<ApiResponse<Order>>(`/orders/${id}/cancel`);
  return response.data.data;
};
