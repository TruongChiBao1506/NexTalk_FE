import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';

export interface MessageReminderResponse {
  id: string;
  messageId: string;
  conversationId: string;
  senderUsername: string;
  messagePreview: string;
  remindAt: string;
  note: string;
  status: 'PENDING' | 'FIRED' | 'DELETED';
  createdAt: string;
  firedAt?: string | null;
  deletedAt?: string | null;
}

export const reminderService = {
  async getMyReminders(): Promise<ApiResponse<MessageReminderResponse[]>> {
    const response = await apiClient.get<ApiResponse<MessageReminderResponse[]>>('/reminders');
    return response.data;
  },

  async createReminder(payload: {
    messageId: string;
    remindAt: string;
    note: string;
  }): Promise<ApiResponse<MessageReminderResponse>> {
    const response = await apiClient.post<ApiResponse<MessageReminderResponse>>('/reminders', payload);
    return response.data;
  },

  async deleteReminder(id: string): Promise<ApiResponse<MessageReminderResponse>> {
    const response = await apiClient.delete<ApiResponse<MessageReminderResponse>>(`/reminders/${id}`);
    return response.data;
  },

  async markReminderFired(id: string): Promise<ApiResponse<MessageReminderResponse>> {
    const response = await apiClient.post<ApiResponse<MessageReminderResponse>>(`/reminders/${id}/fire`);
    return response.data;
  },
};
