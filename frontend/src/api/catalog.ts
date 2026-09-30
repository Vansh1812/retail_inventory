import apiClient from './axios';
import { ApiResponse } from '../types/api';
import { Category, Product, ProductFormData, ProductStatus } from '../types/catalog';
import { PageData } from '../types/admin';

export const fetchCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<ApiResponse<Category[]>>('/categories');
  return response.data.data;
};

export const fetchProducts = async (
  page: number = 0,
  size: number = 10,
  search?: string,
  categoryId?: number | '',
  status?: ProductStatus | ''
): Promise<PageData<Product>> => {
  const params: Record<string, string | number> = { page, size };
  if (search && search.trim()) {
    params.search = search.trim();
  }
  if (categoryId !== undefined && categoryId !== '') {
    params.categoryId = categoryId;
  }
  if (status) {
    params.status = status;
  }

  const response = await apiClient.get<ApiResponse<PageData<Product>>>('/products', { params });
  return response.data.data;
};

export const fetchProductById = async (id: number): Promise<Product> => {
  const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
  return response.data.data;
};

export const createProduct = async (data: ProductFormData): Promise<Product> => {
  const response = await apiClient.post<ApiResponse<Product>>('/products', data);
  return response.data.data;
};

export const updateProduct = async (id: number, data: ProductFormData): Promise<Product> => {
  const response = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, data);
  return response.data.data;
};

export const toggleProductStatus = async (id: number): Promise<Product> => {
  const response = await apiClient.put<ApiResponse<Product>>(`/products/${id}/status`);
  return response.data.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(`/products/${id}`);
};
