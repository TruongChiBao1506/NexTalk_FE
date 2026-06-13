export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  status: string;
  lastSeen?: string;
  isVerified: boolean;
  hasChatPin?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[] | null;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterResponseData {
  id: string;
  email: string;
  username: string;
  isVerified: boolean;
}

export interface TokenRefreshResponseData {
  accessToken: string;
  refreshToken: string;
}
