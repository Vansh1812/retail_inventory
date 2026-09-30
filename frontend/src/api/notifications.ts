import apiClient from './axios';
import { ApiResponse } from '../types/api';

export type NotificationType = 'LOW_STOCK' | 'NEW_ORDER' | 'PO_STATUS' | 'SYSTEM_ALERT';

export interface NotificationDto {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export const fetchNotifications = async (unreadOnly?: boolean): Promise<NotificationDto[]> => {
  const params: Record<string, string> = {};
  if (unreadOnly) {
    params.unreadOnly = 'true';
  }
  const response = await apiClient.get<ApiResponse<any>>('/notifications', { params });
  const data = response.data.data;
  return Array.isArray(data) ? data : data?.content || [];
};

export const fetchUnreadNotifications = async (): Promise<NotificationDto[]> => {
  const response = await apiClient.get<ApiResponse<NotificationDto[]>>('/notifications/unread');
  return response.data.data || [];
};

export const fetchUnreadNotificationCount = async (): Promise<number> => {
  const response = await apiClient.get<ApiResponse<any>>('/notifications/unread-count');
  const data = response.data.data;
  return typeof data === 'number' ? data : Number(data?.unreadCount ?? 0);
};

export const markNotificationAsRead = async (id: number): Promise<void> => {
  await apiClient.put<ApiResponse<void>>(`/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await apiClient.put<ApiResponse<void>>('/notifications/read-all');
};
