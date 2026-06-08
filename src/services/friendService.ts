import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';
import type { FriendResponse } from '../types/friend';

export const friendService = {
  async sendRequest(receiverId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>('/friends/request', { receiverId });
    return response.data;
  },

  async acceptRequest(senderId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.put<ApiResponse<void>>('/friends/accept', { senderId });
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

  async getFriends(): Promise<ApiResponse<FriendResponse[]>> {
    const response = await apiClient.get<ApiResponse<FriendResponse[]>>('/friends');
    return response.data;
  },

  async getPending(): Promise<ApiResponse<FriendResponse[]>> {
    const response = await apiClient.get<ApiResponse<FriendResponse[]>>('/friends/pending');
    return response.data;
  }
};
