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
  },

  async editMessage(id: string, content: string): Promise<ApiResponse<MessageResponse>> {
    const response = await apiClient.put<ApiResponse<MessageResponse>>(`/messages/${id}`, {
      content
    });
    return response.data;
  },

  async recallMessage(id: string): Promise<ApiResponse<MessageResponse>> {
    const response = await apiClient.post<ApiResponse<MessageResponse>>(`/messages/${id}/recall`);
    return response.data;
  },

  async deleteMessage(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/messages/${id}`);
    return response.data;
  },

  async pinMessage(id: string): Promise<ApiResponse<MessageResponse>> {
    const response = await apiClient.post<ApiResponse<MessageResponse>>(`/messages/${id}/pin`);
    return response.data;
  },

  async unpinMessage(id: string): Promise<ApiResponse<MessageResponse>> {
    const response = await apiClient.delete<ApiResponse<MessageResponse>>(`/messages/${id}/pin`);
    return response.data;
  },

  async getPinnedMessages(conversationId: string): Promise<ApiResponse<MessageResponse[]>> {
    const response = await apiClient.get<ApiResponse<MessageResponse[]>>(`/conversations/${conversationId}/pinned`);
    return response.data;
  },

  async reactToMessage(id: string, emoji: string): Promise<ApiResponse<MessageResponse>> {
    const response = await apiClient.post<ApiResponse<MessageResponse>>(`/messages/${id}/react`, {
      emoji
    });
    return response.data;
  },

  async searchMessages(query: string, conversationId?: string): Promise<ApiResponse<MessageResponse[]>> {
    const response = await apiClient.get<ApiResponse<MessageResponse[]>>('/messages/search', {
      params: { query, conversationId }
    });
    return response.data;
  }
};

