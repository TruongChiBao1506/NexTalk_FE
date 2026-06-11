import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';
import type { ConversationResponse, ConversationSummaryResponse } from '../types/chat';

export const conversationService = {
  async getOrCreatePrivateConversation(friendId: string): Promise<ApiResponse<ConversationResponse>> {
    const response = await apiClient.post<ApiResponse<ConversationResponse>>(`/conversations/private/${friendId}`);
    return response.data;
  },

  async getUserConversations(): Promise<ApiResponse<ConversationResponse[]>> {
    const response = await apiClient.get<ApiResponse<ConversationResponse[]>>('/conversations');
    return response.data;
  },

  async getConversationById(id: string): Promise<ApiResponse<ConversationResponse>> {
    const response = await apiClient.get<ApiResponse<ConversationResponse>>(`/conversations/${id}`);
    return response.data;
  },

  async summarizeConversation(id: string): Promise<ApiResponse<ConversationSummaryResponse>> {
    const response = await apiClient.post<ApiResponse<ConversationSummaryResponse>>(`/conversations/${id}/summary`);
    return response.data;
  }
};
