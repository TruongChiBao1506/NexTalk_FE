import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';
import type {
  GroupResponse,
  CreateGroupRequest,
  UpdateGroupRequest,
  AddMemberRequest,
  UpdateMemberRoleRequest,
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
};
