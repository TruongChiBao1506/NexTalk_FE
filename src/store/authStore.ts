import { create } from 'zustand'
import type { User } from '../types/auth'

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken?: string | null) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Safe parsing for user from localStorage
  let initialUser: User | null = null;
  try {
    const storedUser = localStorage.getItem('nextalk_user');
    if (storedUser) {
      initialUser = JSON.parse(storedUser);
    }
  } catch (e) {
    console.error('Failed to parse initial user from localStorage', e);
  }

  return {
    user: initialUser,
    accessToken: null,
    isAuthenticated: false,

    login: (user, accessToken) => {
      localStorage.setItem('nextalk_user', JSON.stringify(user));
      localStorage.removeItem('nextalk_accessToken');
      localStorage.removeItem('nextalk_refreshToken');
      set({ user, accessToken, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem('nextalk_user');
      localStorage.removeItem('nextalk_accessToken');
      localStorage.removeItem('nextalk_refreshToken');
      set({ user: null, accessToken: null, isAuthenticated: false });
    },

    updateUser: (user) => {
      localStorage.setItem('nextalk_user', JSON.stringify(user));
      set({ user });
    },

    setAccessToken: (accessToken) => {
      localStorage.removeItem('nextalk_accessToken');
      set({ accessToken });
    }
  };
});
