import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';

export interface ConversationTag {
  id: string;
  name: string;
  color: string;
  position?: number;
  createdAt?: string;
}

export interface ConversationTagData {
  tags: ConversationTag[];
  mappings: Record<string, string[]>; // targetId -> list of tagIds
}

export const conversationTagService = {
  async getUserTagData(): Promise<ConversationTagData> {
    const res = await apiClient.get<ApiResponse<ConversationTagData>>('/conversation-tags');
    return res.data.data;
  },

  async createTag(name: string, color: string): Promise<ConversationTag> {
    const res = await apiClient.post<ApiResponse<ConversationTag>>('/conversation-tags', { name, color });
    return res.data.data;
  },

  async updateTag(tagId: string, name: string, color: string): Promise<ConversationTag> {
    const res = await apiClient.put<ApiResponse<ConversationTag>>(`/conversation-tags/${tagId}`, { name, color });
    return res.data.data;
  },

  async deleteTag(tagId: string): Promise<void> {
    await apiClient.delete(`/conversation-tags/${tagId}`);
  },

  async assignTag(tagId: string, targetId: string, targetType: 'DM' | 'GROUP' = 'DM'): Promise<ConversationTagData> {
    const res = await apiClient.post<ApiResponse<ConversationTagData>>(`/conversation-tags/${tagId}/assign`, { targetId, targetType });
    return res.data.data;
  },

  async unassignTag(tagId: string, targetId: string): Promise<ConversationTagData> {
    const res = await apiClient.delete<ApiResponse<ConversationTagData>>(`/conversation-tags/${tagId}/assign/${targetId}`);
    return res.data.data;
  },
};
