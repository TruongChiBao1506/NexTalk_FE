import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';
import type { NotificationResponse } from '../types/notification';

export const notificationService = {
  async getMyNotifications(): Promise<ApiResponse<NotificationResponse[]>> {
    const response = await apiClient.get<ApiResponse<NotificationResponse[]>>('/notifications');
    return response.data;
  },

  async markAsRead(id: string): Promise<ApiResponse<NotificationResponse>> {
    const response = await apiClient.put<ApiResponse<NotificationResponse>>(`/notifications/${id}/read`);
    return response.data;
  },

  async getUnreadCount(): Promise<ApiResponse<number>> {
    const response = await apiClient.get<ApiResponse<number>>('/notifications/unread-count');
    return response.data;
  }
};
