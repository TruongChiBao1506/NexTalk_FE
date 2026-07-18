import { apiClient } from '../api/apiClient';
import type {
  ApiResponse,
  LoginResponseData,
  QrLoginInitResponseData,
  QrLoginStatusResponseData,
  RegisterResponseData
} from '../types/auth';
import type { LoginRequest, RegisterRequest } from '../types/authRequests';

export interface SessionResponse {
  id: string;
  deviceName: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt?: string | null;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
}

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

  async logout(): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>('/auth/logout', {});
    return response.data;
  },

  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(data: { token: string; newPassword: string }): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>('/auth/reset-password', data);
    return response.data;
  },

  async googleLogin(idToken: string): Promise<ApiResponse<LoginResponseData>> {
    const response = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/google-login', { idToken });
    return response.data;
  },

  async initQrLogin(): Promise<ApiResponse<QrLoginInitResponseData>> {
    const response = await apiClient.post<ApiResponse<QrLoginInitResponseData>>('/auth/qr/init');
    return response.data;
  },

  async getQrLoginStatus(sessionId: string): Promise<ApiResponse<QrLoginStatusResponseData>> {
    const response = await apiClient.get<ApiResponse<QrLoginStatusResponseData>>(`/auth/qr/status/${sessionId}`);
    return response.data;
  },

  async confirmQrLogin(qrToken: string): Promise<ApiResponse<QrLoginStatusResponseData>> {
    const response = await apiClient.post<ApiResponse<QrLoginStatusResponseData>>('/auth/qr/confirm', { qrToken });
    return response.data;
  },

  async getSessions(): Promise<ApiResponse<SessionResponse[]>> {
    const response = await apiClient.get<ApiResponse<SessionResponse[]>>('/auth/sessions');
    return response.data;
  },

  async revokeSession(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/auth/sessions/${id}`);
    return response.data;
  },

  async revokeAllSessions(): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>('/auth/sessions');
    return response.data;
  }
};
