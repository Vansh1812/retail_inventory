import apiClient from './axios';
import { ApiResponse } from '../types/api';
import { Order } from '../types/order';
import { PurchaseOrder } from '../types/procurement';

export interface CustomerPlaceOrderItem {
  productId: number;
  quantity: number;
}

export interface CustomerPlaceOrderPayload {
  warehouseId?: number;
  notes?: string;
  items: CustomerPlaceOrderItem[];
}

export const getCustomerOrders = async (): Promise<Order[]> => {
  const response = await apiClient.get<ApiResponse<Order[]>>('/portal/customer/my-orders');
  return response.data.data;
};

export const getCustomerOrder = async (id: number): Promise<Order> => {
  const response = await apiClient.get<ApiResponse<Order>>(`/portal/customer/my-orders/${id}`);
  return response.data.data;
};

export const placeCustomerOrder = async (payload: CustomerPlaceOrderPayload): Promise<Order> => {
  const response = await apiClient.post<ApiResponse<Order>>('/portal/customer/place-order', payload);
  return response.data.data;
};

export const getSupplierPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  const response = await apiClient.get<ApiResponse<PurchaseOrder[]>>('/portal/supplier/my-purchase-orders');
  return response.data.data;
};

export const acknowledgePurchaseOrder = async (id: number): Promise<PurchaseOrder> => {
  const response = await apiClient.put<ApiResponse<PurchaseOrder>>(`/portal/supplier/purchase-orders/${id}/acknowledge`);
  return response.data.data;
};
