import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';

export type TaskAssistantStatus = 'COMPLETED' | 'CONFIRMATION_REQUIRED' | 'REJECTED';

export interface TaskAssistantAction {
  toolName: string;
  label: string;
  summary: string;
  arguments: Record<string, unknown>;
}

export interface TaskAssistantResult {
  status: TaskAssistantStatus;
  reply: string;
  confirmationId?: string | null;
  action?: TaskAssistantAction | null;
  result?: Record<string, unknown> | null;
}

export interface TaskAssistantRequest {
  conversationId: string;
  prompt: string;
  groupId?: string;
  channelId?: string;
}

export const taskAssistantService = {
  async ask(request: TaskAssistantRequest): Promise<ApiResponse<TaskAssistantResult>> {
    const response = await apiClient.post<ApiResponse<TaskAssistantResult>>('/task-assistant/ask', request);
    return response.data;
  },

  async confirm(confirmationId: string): Promise<ApiResponse<TaskAssistantResult>> {
    const response = await apiClient.post<ApiResponse<TaskAssistantResult>>(
      `/task-assistant/${confirmationId}/confirm`,
    );
    return response.data;
  },

  async reject(confirmationId: string): Promise<ApiResponse<TaskAssistantResult>> {
    const response = await apiClient.post<ApiResponse<TaskAssistantResult>>(
      `/task-assistant/${confirmationId}/reject`,
    );
    return response.data;
  },
};
