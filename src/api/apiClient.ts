import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import type { ApiResponse, TokenRefreshResponseData } from '../types/auth';

// Create custom axios instance
export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Shared promise to handle concurrent refresh requests
let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = localStorage.getItem('nextalk_refreshToken');
  if (!refreshToken) {
    useAuthStore.getState().logout();
    return null;
  }

  refreshPromise = (async () => {
    try {
      const response = await axios.post<ApiResponse<TokenRefreshResponseData>>(
        '/api/auth/refresh',
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        // Save new tokens
        useAuthStore.getState().setAccessToken(accessToken);
        if (newRefreshToken) {
          localStorage.setItem('nextalk_refreshToken', newRefreshToken);
        }
        return accessToken;
      } else {
        throw new Error('Refresh response was unsuccessful');
      }
    } catch (refreshError) {
      useAuthStore.getState().logout();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Request interceptor to attach access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('nextalk_accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 and refresh tokens
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If request failed with 401 (Unauthorized) and has not been retried yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      
      // Prevent infinite loops if the refresh request itself fails with 401
      if (originalRequest.url === '/auth/refresh' || originalRequest.url === '/auth/login') {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const accessToken = await refreshAccessToken();
        if (accessToken) {
          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return apiClient(originalRequest);
        } else {
          return Promise.reject(error);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

