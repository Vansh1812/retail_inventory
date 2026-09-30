import apiClient from './axios';
import { ApiResponse } from '../types/api';
import { PageData } from '../types/admin';
import { Customer, CustomerFormData } from '../types/order';

export const fetchCustomers = async (
  page: number = 0,
  size: number = 10,
  search?: string
): Promise<PageData<Customer>> => {
  const params: Record<string, string | number> = { page, size };
  if (search && search.trim()) params.search = search.trim();

  const response = await apiClient.get<ApiResponse<PageData<Customer>>>('/customers', { params });
  return response.data.data;
};

export const fetchAllCustomers = async (): Promise<Customer[]> => {
  const response = await apiClient.get<ApiResponse<Customer[]>>('/customers/all');
  return response.data.data;
};

export const fetchCustomerById = async (id: number): Promise<Customer> => {
  const response = await apiClient.get<ApiResponse<Customer>>(`/customers/${id}`);
  return response.data.data;
};

export const createCustomer = async (data: CustomerFormData): Promise<Customer> => {
  const response = await apiClient.post<ApiResponse<Customer>>('/customers', data);
  return response.data.data;
};

export const updateCustomer = async (id: number, data: CustomerFormData): Promise<Customer> => {
  const response = await apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, data);
  return response.data.data;
};
