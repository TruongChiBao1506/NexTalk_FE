import { create } from 'zustand';
import { groupService } from '../services/groupService';
import type { ChannelTaskResponse } from '../types/group';

interface MyTasksState {
  tasks: ChannelTaskResponse[];
  isOpen: boolean;
  archived: boolean;
  isLoading: boolean;
  error: string | null;
  togglePanel: () => void;
  closePanel: () => void;
  fetchTasks: (archived?: boolean) => Promise<void>;
}

export const useMyTasksStore = create<MyTasksState>((set, get) => ({
  tasks: [],
  isOpen: false,
  archived: false,
  isLoading: false,
  error: null,
  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
  closePanel: () => set({ isOpen: false }),
  fetchTasks: async (archived = get().archived) => {
    set({ archived, isLoading: true, error: null });
    try {
      const response = await groupService.getMyTasks(archived);
      if (!response.success) throw new Error(response.message);
      set({ tasks: response.data ?? [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Không thể tải Task của tôi' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
