import { create } from 'zustand'
import type { FriendResponse, FriendSuggestionResponse } from '../types/friend'
import { friendService } from '../services/friendService'

interface FriendState {
  friends: FriendResponse[];
  pending: FriendResponse[];
  suggestions: FriendSuggestionResponse[];
  isLoading: boolean;
  error: string | null;
  fetchFriends: () => Promise<void>;
  fetchPending: () => Promise<void>;
  fetchSuggestions: () => Promise<void>;
  sendFriendRequest: (userId: string) => Promise<boolean>;
  cancelFriendRequest: (userId: string) => Promise<boolean>;
  acceptRequest: (userId: string) => Promise<string | null>;
  rejectRequest: (userId: string) => Promise<boolean>;
  removeFriend: (userId: string) => Promise<boolean>;
  updateFriendPresence: (userId: string, status: string, lastSeen?: string) => void;
  updateSuggestionRequestSent: (userId: string, isSent: boolean) => void;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  pending: [],
  suggestions: [],
  isLoading: false,
  error: null,

  fetchFriends: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await friendService.getFriends();
      if (response.success && response.data) {
        set({ friends: response.data });
      } else {
        set({ error: response.message || 'Failed to load friends list' });
      }
    } catch (err: any) {
      console.error(err);
      set({ error: err.response?.data?.message || 'Failed to fetch friends' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPending: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await friendService.getPending();
      if (response.success && response.data) {
        set({ pending: response.data });
      } else {
        set({ error: response.message || 'Failed to load pending requests' });
      }
    } catch (err: any) {
      console.error(err);
      set({ error: err.response?.data?.message || 'Failed to fetch pending requests' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSuggestions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await friendService.getSuggestions();
      if (response.success && response.data) {
        set({ suggestions: response.data });
      } else {
        set({ error: response.message || 'Failed to load suggestions' });
      }
    } catch (err: any) {
      console.error(err);
      set({ error: err.response?.data?.message || 'Failed to fetch suggestions' });
    } finally {
      set({ isLoading: false });
    }
  },

  sendFriendRequest: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await friendService.sendRequest(userId);
      if (response.success) {
        get().updateSuggestionRequestSent(userId, true);
      }
      return response.success;
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to send friend request';
      set({ error: msg });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  cancelFriendRequest: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await friendService.cancelRequest(userId);
      if (response.success) {
        get().updateSuggestionRequestSent(userId, false);
      }
      return response.success;
    } catch (err: any) {
      console.error(err);
      set({ error: err.response?.data?.message || 'Failed to cancel friend request' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  acceptRequest: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await friendService.acceptRequest(userId);
      if (response.success) {
        await get().fetchFriends();
        await get().fetchPending();
        return response.data?.conversationId ?? null;
      }
      return null;
    } catch (err: any) {
      console.error(err);
      set({ error: err.response?.data?.message || 'Failed to accept friend request' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  rejectRequest: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await friendService.rejectRequest(userId);
      if (response.success) {
        await get().fetchPending();
        return true;
      }
      return false;
    } catch (err: any) {
      console.error(err);
      set({ error: err.response?.data?.message || 'Failed to reject friend request' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  removeFriend: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await friendService.removeFriend(userId);
      if (response.success) {
        await get().fetchFriends();
        return true;
      }
      return false;
    } catch (err: any) {
      console.error(err);
      set({ error: err.response?.data?.message || 'Failed to remove friend' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateFriendPresence: (userId, status, lastSeen) => {
    set((state) => ({
      friends: state.friends.map((f) =>
        f.id === userId ? { ...f, status, lastSeen: lastSeen || f.lastSeen } : f
      ),
    }));
  },

  updateSuggestionRequestSent: (userId, isSent) => {
    set((state) => ({
      suggestions: state.suggestions.map((s) =>
        s.id === userId ? { ...s, isRequestSent: isSent } : s
      ),
    }));
  }
}));
