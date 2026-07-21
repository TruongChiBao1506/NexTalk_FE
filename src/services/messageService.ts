import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';
import type { MessageResponse } from '../types/chat';

export interface CreatePollPayload {
  conversationId: string;
  question: string;
  options: string[];
  allowMultiple: boolean;
  allowAddOptions: boolean;
  anonymous: boolean;
  expiresAt?: string | null;
}

export const messageService = {
  async sendMessage(payload: { conversationId: string; content: string; messageType?: string }): Promise<ApiResponse<MessageResponse>> {
    const response = await apiClient.post<ApiResponse<MessageResponse>>('/messages', payload);
    return response.data;
  },
  async getUnreadCounts(): Promise<ApiResponse<Record<string, number>>> {
    const response = await apiClient.get<ApiResponse<Record<string, number>>>('/messages/unread-counts');
    return response.data;
  },
  async getLatestMessages(conversationIds: string[]): Promise<ApiResponse<MessageResponse[]>> {
    const response = await apiClient.post<ApiResponse<MessageResponse[]>>('/messages/latest', conversationIds);
    return response.data;
  },
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

  async recallAttachment(id: string, attachmentUrl: string): Promise<ApiResponse<MessageResponse>> {
    const response = await apiClient.post<ApiResponse<MessageResponse>>(`/messages/${id}/attachment/recall`, null, {
      params: { attachmentUrl }
    });
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

  async shareMessage(id: string, targetConversationIds: string[]): Promise<ApiResponse<MessageResponse[]>> {
    const response = await apiClient.post<ApiResponse<MessageResponse[]>>(`/messages/${id}/share`, {
      targetConversationIds
    });
    return response.data;
  },

  async batchDeleteMessages(messageIds: string[]): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/messages/batch`, {
      data: { messageIds }
    });
    return response.data;
  },

  async batchRecallMessages(messageIds: string[]): Promise<ApiResponse<MessageResponse[]>> {
    const response = await apiClient.post<ApiResponse<MessageResponse[]>>(`/messages/batch/recall`, {
      messageIds
    });
    return response.data;
  },

  async batchShareMessages(messageIds: string[], targetConversationIds: string[]): Promise<ApiResponse<MessageResponse[]>> {
    const response = await apiClient.post<ApiResponse<MessageResponse[]>>(`/messages/batch/share`, {
      messageIds,
      targetConversationIds
    });
    return response.data;
  },

  async searchMessages(query: string, conversationId?: string): Promise<ApiResponse<MessageResponse[]>> {
    const response = await apiClient.get<ApiResponse<MessageResponse[]>>('/messages/search', {
      params: { query, conversationId }
    });
    return response.data;
  },

  async createPoll(payload: CreatePollPayload): Promise<ApiResponse<MessageResponse>> {
    const response = await apiClient.post<ApiResponse<MessageResponse>>('/messages/polls', payload);
    return response.data;
  },

  async votePoll(id: string, optionId: string): Promise<ApiResponse<MessageResponse>> {
    const response = await apiClient.post<ApiResponse<MessageResponse>>(`/messages/${id}/poll/vote`, { optionId });
    return response.data;
  },

  async addPollOption(id: string, text: string): Promise<ApiResponse<MessageResponse>> {
    const response = await apiClient.post<ApiResponse<MessageResponse>>(`/messages/${id}/poll/options`, { text });
    return response.data;
  },

  async lockPoll(id: string): Promise<ApiResponse<MessageResponse>> {
    const response = await apiClient.post<ApiResponse<MessageResponse>>(`/messages/${id}/poll/lock`);
    return response.data;
  },

  async deletePoll(id: string): Promise<ApiResponse<MessageResponse>> {
    const response = await apiClient.delete<ApiResponse<MessageResponse>>(`/messages/${id}/poll`);
    return response.data;
  },

  async fetchLinkPreview(url: string): Promise<ApiResponse<import('../types/chat').LinkPreviewMetadata | null>> {
    const response = await apiClient.get<ApiResponse<import('../types/chat').LinkPreviewMetadata | null>>('/messages/link-preview', {
      params: { url }
    });
    return response.data;
  }
};
