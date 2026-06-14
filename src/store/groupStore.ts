import { create } from 'zustand';
import { groupService } from '../services/groupService';
import type { GroupResponse, CreateGroupRequest, GroupRole, UpdateGroupRequest } from '../types/group';

const dedupeGroups = (groups: GroupResponse[]) => {
  const byId = new Map<string, GroupResponse>();
  for (const group of groups) {
    byId.set(group.id, group);
  }
  return Array.from(byId.values());
};

interface GroupState {
  groups: GroupResponse[];
  isLoading: boolean;
  error: string | null;

  fetchGroups: () => Promise<void>;
  createGroup: (data: CreateGroupRequest) => Promise<GroupResponse | null>;
  updateGroup: (id: string, data: UpdateGroupRequest) => Promise<GroupResponse | null>;
  deleteGroup: (id: string) => Promise<boolean>;
  addMember: (groupId: string, userId: string) => Promise<boolean>;
  removeMember: (groupId: string, userId: string) => Promise<boolean>;
  updateMemberRole: (groupId: string, userId: string, role: GroupRole) => Promise<boolean>;
  upsertGroup: (group: GroupResponse) => void;
  createChannel: (groupId: string, data: { name: string; type?: string; isPrivate?: boolean }) => Promise<boolean>;
  updateChannel: (groupId: string, channelId: string, data: { name?: string; type?: string; isPrivate?: boolean }) => Promise<boolean>;
  deleteChannel: (groupId: string, channelId: string) => Promise<boolean>;
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
        set({ groups: dedupeGroups(response.data), isLoading: false });
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
          groups: dedupeGroups([newGroup, ...state.groups]),
          isLoading: false,
        }));
        return newGroup;
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to create group', isLoading: false });
    }
    return null;
  },

  updateGroup: async (id: string, data: UpdateGroupRequest) => {
    try {
      const response = await groupService.updateGroup(id, data);
      if (response.success && response.data) {
        get().upsertGroup(response.data);
        return response.data;
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to update group' });
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

  updateMemberRole: async (groupId: string, userId: string, role: GroupRole) => {
    try {
      const response = await groupService.updateMemberRole(groupId, userId, { role });
      if (response.success && response.data) {
        get().upsertGroup(response.data);
        return true;
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to update member role' });
    }
    return false;
  },

  upsertGroup: (group: GroupResponse) => {
    set((state) => {
      const idx = state.groups.findIndex((g) => g.id === group.id);
      if (idx > -1) {
        const list = [...state.groups];
        list[idx] = group;
        return { groups: dedupeGroups(list) };
      }
      return { groups: dedupeGroups([group, ...state.groups]) };
    });
  },

  createChannel: async (groupId: string, data) => {
    try {
      const response = await groupService.createChannel(groupId, data);
      if (response.success && response.data) {
        // Refresh the group to get updated channels list
        const groupResponse = await groupService.getGroup(groupId);
        if (groupResponse.success && groupResponse.data) {
          get().upsertGroup(groupResponse.data);
        }
        return true;
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to create channel' });
    }
    return false;
  },

  updateChannel: async (groupId: string, channelId: string, data) => {
    try {
      const response = await groupService.updateChannel(groupId, channelId, data);
      if (response.success && response.data) {
        const groupResponse = await groupService.getGroup(groupId);
        if (groupResponse.success && groupResponse.data) {
          get().upsertGroup(groupResponse.data);
        }
        return true;
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to update channel' });
    }
    return false;
  },

  deleteChannel: async (groupId: string, channelId: string) => {
    try {
      await groupService.deleteChannel(groupId, channelId);
      const groupResponse = await groupService.getGroup(groupId);
      if (groupResponse.success && groupResponse.data) {
        get().upsertGroup(groupResponse.data);
      }
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete channel' });
    }
    return false;
  },
}));
