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
  birthday?: string;
  enableBirthdayNotification?: boolean;
  showActivityStatus?: boolean;
  blockStrangerMessages?: boolean;
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
  refreshToken?: string | null;
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
  refreshToken?: string | null;
}

export type QrLoginStatus = 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'CONSUMED';

export interface QrLoginInitResponseData {
  sessionId: string;
  qrToken: string;
  expiresAt: string;
}

export interface QrLoginStatusResponseData {
  status: QrLoginStatus;
  expiresAt: string;
  login?: LoginResponseData | null;
}
