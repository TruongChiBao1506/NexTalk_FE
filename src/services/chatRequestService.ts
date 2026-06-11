import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';
import type { ChatRequestResponse, CreateChatRequestPayload } from '../types/chatRequest';

export const chatRequestService = {
  async create(data: CreateChatRequestPayload): Promise<ApiResponse<ChatRequestResponse>> {
    const response = await apiClient.post<ApiResponse<ChatRequestResponse>>('/chat-requests', data);
    return response.data;
  },

  async getIncoming(): Promise<ApiResponse<ChatRequestResponse[]>> {
    const response = await apiClient.get<ApiResponse<ChatRequestResponse[]>>('/chat-requests/incoming');
    return response.data;
  },

  async getOutgoing(): Promise<ApiResponse<ChatRequestResponse[]>> {
    const response = await apiClient.get<ApiResponse<ChatRequestResponse[]>>('/chat-requests/outgoing');
    return response.data;
  },

  async accept(id: string): Promise<ApiResponse<ChatRequestResponse>> {
    const response = await apiClient.post<ApiResponse<ChatRequestResponse>>(`/chat-requests/${id}/accept`);
    return response.data;
  },

  async reject(id: string): Promise<ApiResponse<ChatRequestResponse>> {
    const response = await apiClient.post<ApiResponse<ChatRequestResponse>>(`/chat-requests/${id}/reject`);
    return response.data;
  },
};
