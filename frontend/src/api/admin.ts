import apiClient from './axios';
import { ApiResponse } from '../types/api';
import { AdminUser, AuditLogEntry, PageData } from '../types/admin';

export const fetchAdminUsers = async (
  page: number = 0,
  size: number = 10,
  search?: string
): Promise<PageData<AdminUser>> => {
  const params: Record<string, string | number> = { page, size };
  if (search && search.trim()) {
    params.search = search.trim();
  }
  const response = await apiClient.get<ApiResponse<PageData<AdminUser>>>('/admin/users', { params });
  return response.data.data;
};

export const updateUserRoles = async (
  userId: number,
  roles: string[]
): Promise<AdminUser> => {
  const response = await apiClient.put<ApiResponse<AdminUser>>(`/admin/users/${userId}/roles`, {
    roles,
  });
  return response.data.data;
};

export const toggleUserStatus = async (userId: number): Promise<AdminUser> => {
  const response = await apiClient.put<ApiResponse<AdminUser>>(`/admin/users/${userId}/status`);
  return response.data.data;
};

export const fetchAuditLogs = async (
  page: number = 0,
  size: number = 15
): Promise<PageData<AuditLogEntry>> => {
  const response = await apiClient.get<ApiResponse<PageData<AuditLogEntry>>>('/admin/audit-logs', {
    params: { page, size },
  });
  return response.data.data;
};
