import { create } from 'zustand';
import { groupService } from '../services/groupService';
import type { GroupResponse, CreateGroupRequest, GroupRole, UpdateGroupRequest, GroupInvitationResponse } from '../types/group';

const dedupeGroups = (groups: GroupResponse[]) => {
  const byId = new Map<string, GroupResponse>();
  for (const group of groups) {
    byId.set(group.id, group);
  }
  return Array.from(byId.values());
};

interface GroupState {
  groups: GroupResponse[];
  pendingInvitations: GroupInvitationResponse[];
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
  createChannel: (groupId: string, data: { name: string; type?: string; isPrivate?: boolean; isTaskEnabled?: boolean; isPostingRestricted?: boolean; memberIds?: string[] }) => Promise<boolean>;
  updateChannel: (groupId: string, channelId: string, data: { name?: string; type?: string; isPrivate?: boolean; isTaskEnabled?: boolean; isPostingRestricted?: boolean; memberIds?: string[] }) => Promise<boolean>;
  deleteChannel: (groupId: string, channelId: string) => Promise<boolean>;

  fetchPendingInvitations: () => Promise<void>;
  acceptInvitation: (inviteId: string) => Promise<boolean>;
  rejectInvitation: (inviteId: string) => Promise<boolean>;
  inviteMember: (groupId: string, userId: string) => Promise<boolean>;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  pendingInvitations: [],
  isLoading: false,
  error: null,

  fetchGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await groupService.getMyGroups();
      if (response.success && response.data) {
        const fetchedGroups = dedupeGroups(response.data);
        set({ groups: fetchedGroups, isLoading: false });
        import('./chatStore').then(({ useChatStore }) => {
          fetchedGroups.forEach(g => useChatStore.getState().subscribeToGroupVoice(g.id));
        });
        import('./callStore').then(({ useCallStore }) => {
          const voiceChannelIds = fetchedGroups.flatMap((group) =>
            group.channels.filter((channel) => channel.type === 'VOICE').map((channel) => channel.id)
          );
          void useCallStore.getState().syncVoiceChannelMembers(voiceChannelIds);
        });
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

  fetchPendingInvitations: async () => {
    try {
      const response = await groupService.getPendingInvitations();
      if (response.success && response.data) {
        set({ pendingInvitations: response.data });
      }
    } catch (err: any) {
      console.error('Failed to fetch pending invitations', err);
    }
  },

  acceptInvitation: async (inviteId: string) => {
    try {
      const response = await groupService.acceptInvitation(inviteId);
      if (response.success) {
        set((state) => ({
          pendingInvitations: state.pendingInvitations.filter(i => i.id !== inviteId)
        }));
        get().fetchGroups(); // Refresh groups
        return true;
      }
    } catch (err: any) {
      console.error('Failed to accept invitation', err);
    }
    return false;
  },

  rejectInvitation: async (inviteId: string) => {
    try {
      const response = await groupService.rejectInvitation(inviteId);
      if (response.success) {
        set((state) => ({
          pendingInvitations: state.pendingInvitations.filter(i => i.id !== inviteId)
        }));
        return true;
      }
    } catch (err: any) {
      console.error('Failed to reject invitation', err);
    }
    return false;
  },

  inviteMember: async (groupId: string, userId: string) => {
    try {
      const response = await groupService.inviteMember(groupId, { userId });
      if (response.success) {
        get().fetchGroups(); // Just to refresh if any direct add occurred
        return true;
      }
    } catch (err: any) {
      console.error('Failed to invite member', err);
    }
    return false;
  },
}));
