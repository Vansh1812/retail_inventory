import apiClient from './axios';
import { ApiResponse } from '../types/api';
import { Order, OrderStatus, DispatchOrderFormData } from '../types/order';

export const fetchFulfillmentQueue = async (
  warehouseId?: number | ''
): Promise<Order[]> => {
  const params: Record<string, string | number> = {};
  if (warehouseId !== undefined && warehouseId !== '') params.warehouseId = warehouseId;

  const response = await apiClient.get<ApiResponse<Order[]>>('/fulfillment/queue', { params });
  return response.data.data;
};

export const updateFulfillmentStatus = async (
  orderId: number,
  status: OrderStatus
): Promise<Order> => {
  const response = await apiClient.put<ApiResponse<Order>>(`/fulfillment/${orderId}/status`, { status });
  return response.data.data;
};

export const dispatchOrder = async (
  orderId: number,
  data: DispatchOrderFormData
): Promise<Order> => {
  const response = await apiClient.post<ApiResponse<Order>>(`/fulfillment/${orderId}/ship`, data);
  return response.data.data;
};
