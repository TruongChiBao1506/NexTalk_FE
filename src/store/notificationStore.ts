import { create } from 'zustand';
import type { NotificationResponse } from '../types/notification';
import { notificationService } from '../services/notificationService';

interface NotificationState {
  notifications: NotificationResponse[];
  unreadCount: number;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  ringTrigger: boolean;
  
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: NotificationResponse) => void;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<void>;
  togglePanel: () => void;
  closePanel: () => void;
  setRingTrigger: (trigger: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  isLoading: false,
  error: null,
  ringTrigger: false,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await notificationService.getMyNotifications();
      if (response.success && response.data) {
        // Sort newest first
        const sorted = [...response.data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const unread = sorted.filter(n => !n.read).length;
        set({ notifications: sorted, unreadCount: unread });
      } else {
        set({ error: response.message || 'Failed to load notifications' });
      }
    } catch (err: any) {
      console.error(err);
      set({ error: err.response?.data?.message || 'Failed to fetch notifications' });
    } finally {
      set({ isLoading: false });
    }
  },

  addNotification: (notification) => {
    const { notifications, unreadCount } = get();
    // Check if notification already exists to avoid duplicates
    if (notifications.some(n => n.id === notification.id)) return;

    const updated = [notification, ...notifications];
    const newUnreadCount = notification.read ? unreadCount : unreadCount + 1;
    
    set({
      notifications: updated,
      unreadCount: newUnreadCount,
      ringTrigger: !notification.read // Trigger ring if it's unread
    });
  },

  markAsRead: async (id) => {
    try {
      const response = await notificationService.markAsRead(id);
      if (response.success) {
        const { notifications, unreadCount } = get();
        const found = notifications.find(n => n.id === id);
        if (found) {
          const updated = notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          );
          const wasReadAlready = found.read;
          set({
            notifications: updated,
            unreadCount: wasReadAlready ? unreadCount : Math.max(0, unreadCount - 1)
          });
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  markAllAsRead: async () => {
    const { notifications } = get();
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    try {
      // Mark each as read in parallel
      await Promise.all(unreadNotifications.map(n => notificationService.markAsRead(n.id)));
      
      const updated = notifications.map(n => ({ ...n, read: true }));
      set({
        notifications: updated,
        unreadCount: 0
      });
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  },

  togglePanel: () => {
    set(state => ({ isOpen: !state.isOpen }));
  },

  closePanel: () => {
    set({ isOpen: false });
  },

  setRingTrigger: (trigger) => {
    set({ ringTrigger: trigger });
  }
}));
