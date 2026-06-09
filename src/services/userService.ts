import { apiClient } from '../api/apiClient';
import type { ApiResponse, User } from '../types/auth';

export interface UpdateProfilePayload {
  username: string;
  avatarUrl: string;
  bio: string;
}

export const userService = {
  async getMyProfile(): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>('/users/me');
    return response.data;
  },

  async updateProfile(data: UpdateProfilePayload): Promise<ApiResponse<User>> {
    const response = await apiClient.put<ApiResponse<User>>('/users/profile', data);
    return response.data;
  },

  async getUserProfileById(id: string): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  },

  async searchUser(query: string): Promise<ApiResponse<User[]>> {
    const response = await apiClient.get<ApiResponse<User[]>>('/users/search', {
      params: { query }
    });
    return response.data;
  }
};
