import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';

export interface CreateReportRequest {
  reportedUserId: string;
  conversationId?: string;
  reason: string;
  description?: string;
}

export interface UserReportResponse {
  id: string;
  reporterId: string;
  reportedUserId: string;
  conversationId?: string;
  reason: string;
  description?: string;
  status: string;
  aiVerdict?: string;
  aiReasoning?: string;
  createdAt: string;
  updatedAt: string;
}

export const reportService = {
  async createReport(request: CreateReportRequest): Promise<ApiResponse<UserReportResponse>> {
    const response = await apiClient.post<ApiResponse<UserReportResponse>>('/reports', request);
    return response.data;
  },
};
