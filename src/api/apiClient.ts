import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import type { ApiResponse, TokenRefreshResponseData } from '../types/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

// Create custom axios instance
export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Platform': 'web',
  },
});

// Shared promise to handle concurrent refresh requests
let refreshPromise: Promise<string | null> | null = null;

export function isAccessTokenExpired(token: string, offsetSeconds = 60): boolean {
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    const exp = decodedPayload.exp;
    const now = Math.floor(Date.now() / 1000);
    return exp - now < offsetSeconds;
  } catch {
    return true;
  }
}

export async function ensureFreshAccessToken(offsetSeconds = 60): Promise<string | null> {
  const currentToken = useAuthStore.getState().accessToken;
  if (!currentToken) {
    return refreshAccessToken();
  }

  if (isAccessTokenExpired(currentToken, offsetSeconds)) {
    return refreshAccessToken();
  }

  return currentToken;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await axios.post<ApiResponse<TokenRefreshResponseData>>(
        `${BASE_URL}/api/auth/refresh`,
        {},
        { withCredentials: true, headers: { 'Content-Type': 'application/json', 'X-Client-Platform': 'web' } }
      );

      if (response.data.success && response.data.data) {
        const { accessToken } = response.data.data;
        
        // Save new tokens
        useAuthStore.getState().setAccessToken(accessToken);
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
    const token = useAuthStore.getState().accessToken;
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

    // If request failed with 401 (Unauthorized) or 403 (Forbidden) and has not been retried yet
    if ((error.response?.status === 401 || error.response?.status === 403) && originalRequest && !originalRequest._retry) {
      
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
