import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';
import type { BlockStatusResponse } from '../types/block';

export const blockService = {
  async blockUser(userId: string): Promise<ApiResponse<BlockStatusResponse>> {
    const response = await apiClient.post<ApiResponse<BlockStatusResponse>>(`/blocks/${userId}`);
    return response.data;
  },

  async unblockUser(userId: string): Promise<ApiResponse<BlockStatusResponse>> {
    const response = await apiClient.delete<ApiResponse<BlockStatusResponse>>(`/blocks/${userId}`);
    return response.data;
  },

  async getBlockStatus(userId: string): Promise<ApiResponse<BlockStatusResponse>> {
    const response = await apiClient.get<ApiResponse<BlockStatusResponse>>(`/blocks/${userId}/status`);
    return response.data;
  },
};
