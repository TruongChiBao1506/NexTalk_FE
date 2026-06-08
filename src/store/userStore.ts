import { create } from 'zustand'
import type { User } from '../types/auth'
import { userService } from '../services/userService'
import { useAuthStore } from './authStore'

interface UserState {
  profile: User | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: { username: string; avatarUrl: string; bio: string; }) => Promise<boolean>;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await userService.getMyProfile();
      if (response.success && response.data) {
        set({ profile: response.data });
        // Sync to Auth store
        useAuthStore.getState().updateUser(response.data);
      } else {
        set({ error: response.message || 'Failed to load profile' });
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to fetch profile';
      set({ error: msg });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await userService.updateProfile(data);
      if (response.success && response.data) {
        set({ profile: response.data });
        // Sync to Auth store
        useAuthStore.getState().updateUser(response.data);
        return true;
      } else {
        set({ error: response.message || 'Failed to update profile' });
        return false;
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Failed to update profile';
      set({ error: msg });
      return false;
    } finally {
      set({ isLoading: false });
    }
  }
}));
