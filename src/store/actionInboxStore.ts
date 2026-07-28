import { create } from 'zustand';
import { notificationService } from '../services/notificationService';
import type { ActionItemStatus, NotificationResponse } from '../types/notification';

interface ActionInboxState {
  items: NotificationResponse[];
  pendingCount: number;
  activeStatus: ActionItemStatus;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  togglePanel: () => void;
  closePanel: () => void;
  fetchItems: (status?: ActionItemStatus) => Promise<void>;
  fetchPendingCount: () => Promise<void>;
  addActionItem: (item: NotificationResponse) => void;
  updateAction: (id: string, status: ActionItemStatus, snoozedUntil?: string | null) => Promise<boolean>;
}

export const useActionInboxStore = create<ActionInboxState>((set, get) => ({
  items: [],
  pendingCount: 0,
  activeStatus: 'PENDING',
  isOpen: false,
  isLoading: false,
  error: null,

  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
  closePanel: () => set({ isOpen: false }),

  fetchItems: async (status = get().activeStatus) => {
    set({ isLoading: true, error: null, activeStatus: status });
    try {
      const response = await notificationService.getActionItems(status);
      if (!response.success) throw new Error(response.message || 'Không thể tải Hộp Cần xử lý');
      set({ items: response.data ?? [] });
      if (status === 'PENDING') {
        set({ pendingCount: response.data?.length ?? 0 });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Không thể tải Hộp Cần xử lý' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPendingCount: async () => {
    try {
      const response = await notificationService.getPendingActionCount();
      if (response.success) set({ pendingCount: response.data ?? 0 });
    } catch {
      // Badge refresh is best effort.
    }
  },

  addActionItem: (item) => {
    if (item.actionStatus !== 'PENDING') return;
    set((state) => ({
      items: state.activeStatus === 'PENDING' && !state.items.some((current) => current.id === item.id)
        ? [item, ...state.items]
        : state.items,
      pendingCount: state.pendingCount + (state.items.some((current) => current.id === item.id) ? 0 : 1),
    }));
  },

  updateAction: async (id, status, snoozedUntil = null) => {
    try {
      const response = await notificationService.updateAction(id, status, snoozedUntil);
      if (!response.success) return false;
      const wasPending = get().items.find((item) => item.id === id)?.actionStatus === 'PENDING'
        || get().activeStatus === 'PENDING';
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        pendingCount: wasPending ? Math.max(0, state.pendingCount - 1) : state.pendingCount,
      }));
      return true;
    } catch {
      return false;
    }
  },
}));
