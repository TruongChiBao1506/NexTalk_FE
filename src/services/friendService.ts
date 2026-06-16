import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';
import type { FriendResponse, FriendshipAcceptResponse, FriendSuggestionResponse } from '../types/friend';

export const friendService = {
  async sendRequest(receiverId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>('/friends/request', { receiverId });
    return response.data;
  },

  async acceptRequest(senderId: string): Promise<ApiResponse<FriendshipAcceptResponse>> {
    const response = await apiClient.put<ApiResponse<FriendshipAcceptResponse>>('/friends/accept', { senderId });
    return response.data;
  },

  async rejectRequest(senderId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.put<ApiResponse<void>>('/friends/reject', { senderId });
    return response.data;
  },

  async removeFriend(friendId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>('/friends/remove', {
      params: { friendId }
    });
    return response.data;
  },

  async cancelRequest(receiverId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>('/friends/cancel', {
      params: { receiverId }
    });
    return response.data;
  },

  async getFriends(): Promise<ApiResponse<FriendResponse[]>> {
    const response = await apiClient.get<ApiResponse<FriendResponse[]>>('/friends');
    return response.data;
  },

  async getPending(): Promise<ApiResponse<FriendResponse[]>> {
    const response = await apiClient.get<ApiResponse<FriendResponse[]>>('/friends/pending');
    return response.data;
  },

  async getSuggestions(): Promise<ApiResponse<FriendSuggestionResponse[]>> {
    const response = await apiClient.get<ApiResponse<FriendSuggestionResponse[]>>('/friends/suggestions');
    return response.data;
  }
};
