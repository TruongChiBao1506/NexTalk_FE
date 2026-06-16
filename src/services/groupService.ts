import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';
import type {
  GroupResponse,
  CreateGroupRequest,
  UpdateGroupRequest,
  AddMemberRequest,
  UpdateMemberRoleRequest,
  ChannelResponse,
  GroupInvitationResponse,
  InviteUserRequest,
  PublicGroupInfoResponse,
} from '../types/group';

export const groupService = {
  async createGroup(data: CreateGroupRequest): Promise<ApiResponse<GroupResponse>> {
    const response = await apiClient.post<ApiResponse<GroupResponse>>('/groups', data);
    return response.data;
  },

  async updateGroup(id: string, data: UpdateGroupRequest): Promise<ApiResponse<GroupResponse>> {
    const response = await apiClient.put<ApiResponse<GroupResponse>>(`/groups/${id}`, data);
    return response.data;
  },

  async deleteGroup(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/groups/${id}`);
    return response.data;
  },

  async addMember(groupId: string, data: AddMemberRequest): Promise<ApiResponse<GroupResponse>> {
    const response = await apiClient.post<ApiResponse<GroupResponse>>(`/groups/${groupId}/members`, data);
    return response.data;
  },

  async removeMember(groupId: string, userId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/groups/${groupId}/members/${userId}`);
    return response.data;
  },

  async updateMemberRole(groupId: string, userId: string, data: UpdateMemberRoleRequest): Promise<ApiResponse<GroupResponse>> {
    const response = await apiClient.put<ApiResponse<GroupResponse>>(`/groups/${groupId}/members/${userId}/role`, data);
    return response.data;
  },

  async getGroup(id: string): Promise<ApiResponse<GroupResponse>> {
    const response = await apiClient.get<ApiResponse<GroupResponse>>(`/groups/${id}`);
    return response.data;
  },

  async getMyGroups(): Promise<ApiResponse<GroupResponse[]>> {
    const response = await apiClient.get<ApiResponse<GroupResponse[]>>('/groups');
    return response.data;
  },

  async createChannel(groupId: string, data: { name: string; type?: string; isPrivate?: boolean; memberIds?: string[] }): Promise<ApiResponse<ChannelResponse>> {
    const response = await apiClient.post<ApiResponse<ChannelResponse>>(`/groups/${groupId}/channels`, data);
    return response.data;
  },

  async updateChannel(groupId: string, channelId: string, data: { name?: string; type?: string; isPrivate?: boolean; memberIds?: string[] }): Promise<ApiResponse<ChannelResponse>> {
    const response = await apiClient.put<ApiResponse<ChannelResponse>>(`/groups/${groupId}/channels/${channelId}`, data);
    return response.data;
  },

  async deleteChannel(groupId: string, channelId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/groups/${groupId}/channels/${channelId}`);
    return response.data;
  },

  async getChannels(groupId: string): Promise<ApiResponse<ChannelResponse[]>> {
    const response = await apiClient.get<ApiResponse<ChannelResponse[]>>(`/groups/${groupId}/channels`);
    return response.data;
  },

  async inviteMember(groupId: string, data: InviteUserRequest): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(`/groups/${groupId}/invites`, data);
    return response.data;
  },

  async getPendingInvitations(): Promise<ApiResponse<GroupInvitationResponse[]>> {
    const response = await apiClient.get<ApiResponse<GroupInvitationResponse[]>>(`/groups/invites/pending`);
    return response.data;
  },

  async getWaitingApprovals(groupId: string): Promise<ApiResponse<GroupInvitationResponse[]>> {
    const response = await apiClient.get<ApiResponse<GroupInvitationResponse[]>>(`/groups/${groupId}/invites/waiting`);
    return response.data;
  },

  async acceptInvitation(inviteId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(`/groups/invites/${inviteId}/accept`);
    return response.data;
  },

  async rejectInvitation(inviteId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(`/groups/invites/${inviteId}/reject`);
    return response.data;
  },

  async approveMember(inviteId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(`/groups/invites/${inviteId}/approve`);
    return response.data;
  },

  async declineMember(inviteId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(`/groups/invites/${inviteId}/decline`);
    return response.data;
  },

  async refreshInviteCode(groupId: string): Promise<ApiResponse<GroupResponse>> {
    const response = await apiClient.post<ApiResponse<GroupResponse>>(`/groups/${groupId}/invite-code/refresh`);
    return response.data;
  },

  async getPublicGroupInfoByInviteCode(code: string): Promise<ApiResponse<PublicGroupInfoResponse>> {
    const response = await apiClient.get<ApiResponse<PublicGroupInfoResponse>>(`/groups/join/${code}/info`);
    return response.data;
  },

  async joinGroupByInviteCode(code: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(`/groups/join/${code}`);
    return response.data;
  },
};
