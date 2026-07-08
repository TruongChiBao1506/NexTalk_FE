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
  },

  async updateSelfDestruct(id: string, selfDestructSeconds: number): Promise<ApiResponse<ConversationResponse>> {
    const response = await apiClient.put<ApiResponse<ConversationResponse>>(`/conversations/${id}/self-destruct`, {
      selfDestructSeconds,
    });
    return response.data;
  },

  async pinConversation(id: string): Promise<ApiResponse<ConversationResponse>> {
    const response = await apiClient.put<ApiResponse<ConversationResponse>>(`/conversations/${id}/pin`);
    return response.data;
  },

  async unpinConversation(id: string): Promise<ApiResponse<ConversationResponse>> {
    const response = await apiClient.delete<ApiResponse<ConversationResponse>>(`/conversations/${id}/pin`);
    return response.data;
  },

  async deleteConversation(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/conversations/${id}`);
    return response.data;
  },

  async searchConversations(query: string): Promise<ApiResponse<ConversationResponse[]>> {
    const response = await apiClient.get<ApiResponse<ConversationResponse[]>>('/conversations/search', {
      params: { query }
    });
    return response.data;
  },

  async updateHidden(id: string, hidden: boolean): Promise<ApiResponse<ConversationResponse>> {
    const response = await apiClient.put<ApiResponse<ConversationResponse>>(`/conversations/${id}/hidden`, null, {
      params: { hidden }
    });
    return response.data;
  },

  async updateTheme(id: string, themeColor?: string, wallpaperUrl?: string): Promise<ApiResponse<ConversationResponse>> {
    const response = await apiClient.put<ApiResponse<ConversationResponse>>(`/conversations/${id}/theme`, {
      themeColor,
      wallpaperUrl,
    });
    return response.data;
  }
};
