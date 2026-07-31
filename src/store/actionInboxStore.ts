import { create } from 'zustand';
import { notificationService } from '../services/notificationService';
import type { ActionItemStatus, NotificationResponse } from '../types/notification';

interface ActionInboxState {
  items: NotificationResponse[];
  pendingItems: NotificationResponse[];
  missedCallCounts: Record<string, number>;
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
  resolveMissedCalls: (conversationId: string) => Promise<void>;
}

const getMissedCallCounts = (items: NotificationResponse[]) => items.reduce<Record<string, number>>(
  (counts, item) => {
    if (item.type === 'MISSED_CALL' && item.referenceId) {
      counts[item.referenceId] = (counts[item.referenceId] ?? 0) + 1;
    }
    return counts;
  },
  {},
);

export const useActionInboxStore = create<ActionInboxState>((set, get) => ({
  items: [],
  pendingItems: [],
  missedCallCounts: {},
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
      const responseItems = response.data ?? [];
      set({ items: responseItems });
      if (status === 'PENDING') {
        set({
          pendingItems: responseItems,
          missedCallCounts: getMissedCallCounts(responseItems),
          pendingCount: responseItems.length,
        });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Không thể tải Hộp Cần xử lý' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPendingCount: async () => {
    try {
      const response = await notificationService.getActionItems('PENDING');
      if (response.success) {
        const pendingItems = response.data ?? [];
        set({
          pendingItems,
          missedCallCounts: getMissedCallCounts(pendingItems),
          pendingCount: pendingItems.length,
        });
      }
    } catch {
      // Badge refresh is best effort.
    }
  },

  addActionItem: (item) => {
    if (item.actionStatus !== 'PENDING') return;
    set((state) => {
      if (state.pendingItems.some((current) => current.id === item.id)) return state;
      const pendingItems = [item, ...state.pendingItems];
      return {
        items: state.activeStatus === 'PENDING' ? [item, ...state.items] : state.items,
        pendingItems,
        missedCallCounts: getMissedCallCounts(pendingItems),
        pendingCount: pendingItems.length,
      };
    });
  },

  updateAction: async (id, status, snoozedUntil = null) => {
    try {
      const response = await notificationService.updateAction(id, status, snoozedUntil);
      if (!response.success) return false;
      const wasPending = get().pendingItems.some((item) => item.id === id);
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        pendingItems: state.pendingItems.filter((item) => item.id !== id),
        missedCallCounts: getMissedCallCounts(state.pendingItems.filter((item) => item.id !== id)),
        pendingCount: wasPending ? Math.max(0, state.pendingCount - 1) : state.pendingCount,
      }));
      return true;
    } catch {
      return false;
    }
  },

  resolveMissedCalls: async (conversationId) => {
    const missedCalls = get().pendingItems.filter(
      (item) => item.type === 'MISSED_CALL' && item.referenceId === conversationId,
    );
    if (missedCalls.length === 0) return;
    await Promise.all(missedCalls.map((item) => get().updateAction(item.id, 'RESOLVED')));
  },
}));
