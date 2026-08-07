import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';
import type { ConversationNotificationMode, ConversationResponse, ConversationSummaryResponse, ConversationWithPreviewsResponse } from '../types/chat';

export interface ReplySuggestionsResponse {
  suggestions: string[];
  basedOnMessageId: string;
  cached: boolean;
}

export interface BirthdayContextResponse {
  hasBirthday: boolean;
  userId?: string;
  displayName?: string;
  daysUntil?: number;
  message?: string;
  templates: string[];
}

export const conversationService = {
  async getOrCreatePrivateConversation(friendId: string): Promise<ApiResponse<ConversationResponse>> {
    const response = await apiClient.post<ApiResponse<ConversationResponse>>(`/conversations/private/${friendId}`);
    return response.data;
  },

  async getOrCreateCloudConversation(): Promise<ApiResponse<ConversationResponse>> {
    const response = await apiClient.post<ApiResponse<ConversationResponse>>('/conversations/cloud');
    return response.data;
  },

  async getUserConversations(): Promise<ApiResponse<ConversationResponse[]>> {
    const response = await apiClient.get<ApiResponse<ConversationResponse[]>>('/conversations');
    return response.data;
  },

  async getConversationsWithPreviews(): Promise<ApiResponse<ConversationWithPreviewsResponse>> {
    const response = await apiClient.get<ApiResponse<ConversationWithPreviewsResponse>>('/conversations/with-previews');
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

  async suggestReplies(id: string, lastMessageId?: string): Promise<ApiResponse<ReplySuggestionsResponse>> {
    const response = await apiClient.post<ApiResponse<ReplySuggestionsResponse>>(
      `/conversations/${id}/reply-suggestions`,
      { lastMessageId }
    );
    return response.data;
  },

  async getBirthdayContext(id: string): Promise<ApiResponse<BirthdayContextResponse>> {
    const response = await apiClient.get<ApiResponse<BirthdayContextResponse>>(
      `/conversations/${id}/birthday-context`
    );
    return response.data;
  },

  async personalizeBirthdayWishes(id: string, lastMessageId?: string): Promise<ApiResponse<ReplySuggestionsResponse>> {
    const response = await apiClient.post<ApiResponse<ReplySuggestionsResponse>>(
      `/conversations/${id}/birthday-wishes/personalize`,
      { lastMessageId }
    );
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

  async updateMuted(id: string, muted: boolean): Promise<ApiResponse<ConversationResponse>> {
    const response = await apiClient.put<ApiResponse<ConversationResponse>>(`/conversations/${id}/muted`, null, { params: { muted } });
    return response.data;
  },

  async updateNotificationSettings(
    id: string,
    mode: ConversationNotificationMode,
    mutedUntil?: string | null
  ): Promise<ApiResponse<ConversationResponse>> {
    const response = await apiClient.put<ApiResponse<ConversationResponse>>(
      `/conversations/${id}/notification-settings`,
      { mode, mutedUntil: mutedUntil ?? null }
    );
    return response.data;
  },

  async updateTheme(id: string, themeColor?: string, wallpaperUrl?: string): Promise<ApiResponse<ConversationResponse>> {
    const response = await apiClient.put<ApiResponse<ConversationResponse>>(`/conversations/${id}/theme`, {
      themeColor,
      wallpaperUrl,
    });
    return response.data;
  },

  async updateNickname(id: string, userId: string, nickname: string): Promise<ApiResponse<ConversationResponse>> {
    const response = await apiClient.put<ApiResponse<ConversationResponse>>(`/conversations/${id}/nicknames/${userId}`, { nickname });
    return response.data;
  },

  async updateWordEffects(id: string, wordEffects: any[]): Promise<ApiResponse<ConversationResponse>> {
    const response = await apiClient.put<ApiResponse<ConversationResponse>>(`/conversations/${id}/word-effects`, { wordEffects });
    return response.data;
  },

  async getPendingScheduledMessages(): Promise<ApiResponse<ScheduledMessageResponse[]>> {
    const response = await apiClient.get<ApiResponse<ScheduledMessageResponse[]>>('/messages/scheduled');
    return response.data;
  },

  async cancelScheduledMessage(id: string): Promise<ApiResponse<ScheduledMessageResponse>> {
    const response = await apiClient.delete<ApiResponse<ScheduledMessageResponse>>(`/messages/scheduled/${id}`);
    return response.data;
  },

  async scheduleMessage(payload: ScheduleMessagePayload): Promise<ApiResponse<ScheduledMessageResponse>> {
    const response = await apiClient.post<ApiResponse<ScheduledMessageResponse>>('/messages/scheduled', payload);
    return response.data;
  }
};

export interface ScheduleMessagePayload {
  message: {
    conversationId: string;
    content: string;
  };
  scheduledAt: string;
  silent?: boolean;
}

export interface ScheduledMessageResponse {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  conversationId: string;
  content: string;
  scheduledAt: string;
  status: 'PENDING' | 'DISPATCHED' | 'CANCELLED';
  createdAt: string;
}
