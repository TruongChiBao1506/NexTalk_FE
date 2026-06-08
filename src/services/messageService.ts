import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';
import type { MessageResponse } from '../types/chat';

export const messageService = {
  async getConversationMessages(
    conversationId: string,
    page = 0,
    size = 10
  ): Promise<ApiResponse<MessageResponse[]>> {
    const response = await apiClient.get<ApiResponse<MessageResponse[]>>(`/messages/${conversationId}`, {
      params: { page, size }
    });
    return response.data;
  },

  async markAsDelivered(conversationId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>('/messages/status/delivered', {
      conversationId
    });
    return response.data;
  },

  async markAsSeen(conversationId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>('/messages/status/seen', {
      conversationId
    });
    return response.data;
  }
};
