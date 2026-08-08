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

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function retryAfterMilliseconds(error: AxiosError): number {
  const rawValue = error.response?.headers?.['retry-after'];
  const seconds = Number.parseInt(String(rawValue ?? '1'), 10);
  return Math.min(60, Math.max(1, Number.isFinite(seconds) ? seconds : 1)) * 1000;
}

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
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await axios.post<ApiResponse<TokenRefreshResponseData>>(
          `${BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true, headers: { 'Content-Type': 'application/json', 'X-Client-Platform': 'web' } }
        );

        if (response.data.success && response.data.data) {
          const { accessToken } = response.data.data;
          useAuthStore.getState().setAccessToken(accessToken);
          return accessToken;
        }
        return null;
      } catch (refreshError) {
        const status = axios.isAxiosError(refreshError) ? refreshError.response?.status : undefined;
        if (status === 429 && attempt === 0 && axios.isAxiosError(refreshError)) {
          await wait(retryAfterMilliseconds(refreshError));
          continue;
        }
        // Keep the persisted browser session during transient network or
        // server failures. Only an invalid/revoked refresh cookie is terminal.
        if (status === 400 || status === 401) {
          useAuthStore.getState().logout();
        }
        return null;
      }
    }
    return null;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function requestAccessToken(config: InternalAxiosRequestConfig): string | null {
  const authorization = config.headers?.get?.('Authorization');
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    return null;
  }
  return authorization.slice('Bearer '.length);
}

// Request interceptor to attach access token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const authState = useAuthStore.getState();
    let token = authState.accessToken;
    if (authState.isAuthenticated && (!token || isAccessTokenExpired(token, 60))) {
      token = await refreshAccessToken();
      if (!token) {
        throw new Error('Session refresh is temporarily unavailable');
      }
    }
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

    const status = error.response?.status;
    const currentToken = useAuthStore.getState().accessToken;
    // Older backend deployments answered 403 when an expired JWT was ignored.
    // Only interpret that legacy 403 as authentication failure when the token
    // itself is expired; valid-token authorization failures remain 403.
    const isAuthenticationFailure = status === 401
      || (status === 403 && currentToken !== null && isAccessTokenExpired(currentToken, 0));
    if (isAuthenticationFailure && originalRequest && !originalRequest._retry) {

      // Prevent infinite loops if the refresh request itself fails with 401
      if (originalRequest.url === '/auth/refresh' || originalRequest.url === '/auth/login') {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const failedToken = requestAccessToken(originalRequest);
        if (currentToken
          && currentToken !== failedToken
          && !isAccessTokenExpired(currentToken, 0)) {
          originalRequest.headers.Authorization = `Bearer ${currentToken}`;
          return apiClient(originalRequest);
        }

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
