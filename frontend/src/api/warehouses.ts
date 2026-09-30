import apiClient from './axios';
import { ApiResponse } from '../types/api';
import { Warehouse, WarehouseFormData, WarehouseStatus } from '../types/warehouse';

export const fetchWarehouses = async (
  status?: WarehouseStatus | '',
  search?: string
): Promise<Warehouse[]> => {
  const params: Record<string, string> = {};
  if (status) {
    params.status = status;
  }
  if (search && search.trim()) {
    params.search = search.trim();
  }

  const response = await apiClient.get<ApiResponse<Warehouse[]>>('/warehouses', { params });
  return response.data.data;
};

export const fetchWarehouseById = async (id: number): Promise<Warehouse> => {
  const response = await apiClient.get<ApiResponse<Warehouse>>(`/warehouses/${id}`);
  return response.data.data;
};

export const createWarehouse = async (data: WarehouseFormData): Promise<Warehouse> => {
  const payload = {
    ...data,
    capacity: Number(data.capacity),
  };
  const response = await apiClient.post<ApiResponse<Warehouse>>('/warehouses', payload);
  return response.data.data;
};

export const updateWarehouse = async (id: number, data: WarehouseFormData): Promise<Warehouse> => {
  const payload = {
    ...data,
    capacity: Number(data.capacity),
  };
  const response = await apiClient.put<ApiResponse<Warehouse>>(`/warehouses/${id}`, payload);
  return response.data.data;
};

export const toggleWarehouseStatus = async (
  id: number,
  status?: WarehouseStatus
): Promise<Warehouse> => {
  const body = status ? { status } : {};
  const response = await apiClient.put<ApiResponse<Warehouse>>(`/warehouses/${id}/status`, body);
  return response.data.data;
};
