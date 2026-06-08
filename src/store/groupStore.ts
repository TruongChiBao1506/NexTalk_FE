import { create } from 'zustand';
import { groupService } from '../services/groupService';
import type { GroupResponse, CreateGroupRequest } from '../types/group';

interface GroupState {
  groups: GroupResponse[];
  isLoading: boolean;
  error: string | null;

  fetchGroups: () => Promise<void>;
  createGroup: (data: CreateGroupRequest) => Promise<GroupResponse | null>;
  deleteGroup: (id: string) => Promise<boolean>;
  addMember: (groupId: string, userId: string) => Promise<boolean>;
  removeMember: (groupId: string, userId: string) => Promise<boolean>;
  upsertGroup: (group: GroupResponse) => void;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  isLoading: false,
  error: null,

  fetchGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await groupService.getMyGroups();
      if (response.success && response.data) {
        set({ groups: response.data, isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch groups', isLoading: false });
    }
  },

  createGroup: async (data: CreateGroupRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await groupService.createGroup(data);
      if (response.success && response.data) {
        const newGroup = response.data;
        set((state) => ({
          groups: [newGroup, ...state.groups],
          isLoading: false,
        }));
        return newGroup;
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to create group', isLoading: false });
    }
    return null;
  },

  deleteGroup: async (id: string) => {
    try {
      await groupService.deleteGroup(id);
      set((state) => ({ groups: state.groups.filter((g) => g.id !== id) }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete group' });
      return false;
    }
  },

  addMember: async (groupId: string, userId: string) => {
    try {
      const response = await groupService.addMember(groupId, { userId });
      if (response.success && response.data) {
        get().upsertGroup(response.data);
        return true;
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to add member' });
    }
    return false;
  },

  removeMember: async (groupId: string, userId: string) => {
    try {
      await groupService.removeMember(groupId, userId);
      // Refresh the group
      const response = await groupService.getGroup(groupId);
      if (response.success && response.data) {
        get().upsertGroup(response.data);
      }
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to remove member' });
    }
    return false;
  },

  upsertGroup: (group: GroupResponse) => {
    set((state) => {
      const idx = state.groups.findIndex((g) => g.id === group.id);
      if (idx > -1) {
        const list = [...state.groups];
        list[idx] = group;
        return { groups: list };
      }
      return { groups: [group, ...state.groups] };
    });
  },
}));
