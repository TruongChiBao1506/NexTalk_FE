import { apiClient } from '../api/apiClient';
import type { ApiResponse, LoginResponseData, RegisterResponseData } from '../types/auth';
import type { LoginRequest, RegisterRequest } from '../types/authRequests';

export const authService = {
  async register(data: RegisterRequest): Promise<ApiResponse<RegisterResponseData>> {
    const response = await apiClient.post<ApiResponse<RegisterResponseData>>('/auth/register', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<ApiResponse<LoginResponseData>> {
    const response = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', data);
    return response.data;
  },

  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    // According to postman collection: GET /api/auth/verify-email?token={{verificationToken}}
    const response = await apiClient.get<ApiResponse<void>>(`/auth/verify-email`, {
      params: { token }
    });
    return response.data;
  },

  async logout(refreshToken: string): Promise<ApiResponse<void>> {
    // According to postman collection: POST /api/auth/logout with body { refreshToken }
    const response = await apiClient.post<ApiResponse<void>>('/auth/logout', { refreshToken });
    return response.data;
  }
};
