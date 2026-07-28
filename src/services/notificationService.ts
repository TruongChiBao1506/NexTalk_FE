import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';
import type { ActionItemStatus, NotificationResponse } from '../types/notification';

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
  },

  async getActionItems(status: ActionItemStatus): Promise<ApiResponse<NotificationResponse[]>> {
    const response = await apiClient.get<ApiResponse<NotificationResponse[]>>('/notifications/action-items', {
      params: { status }
    });
    return response.data;
  },

  async updateAction(
    id: string,
    status: ActionItemStatus,
    snoozedUntil?: string | null
  ): Promise<ApiResponse<NotificationResponse>> {
    const response = await apiClient.put<ApiResponse<NotificationResponse>>(`/notifications/${id}/action`, {
      status,
      snoozedUntil: snoozedUntil ?? null
    });
    return response.data;
  },

  async getPendingActionCount(): Promise<ApiResponse<number>> {
    const response = await apiClient.get<ApiResponse<number>>('/notifications/action-items/pending-count');
    return response.data;
  }
};
