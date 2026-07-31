import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';
import type {
  GroupEventResponse,
  GroupEventRsvpStatus,
  SaveGroupEventRequest,
} from '../types/group';

export const groupEventService = {
  async getUpcoming(groupId: string): Promise<GroupEventResponse[]> {
    const { data } = await apiClient.get<ApiResponse<GroupEventResponse[]>>(`/groups/${groupId}/events`);
    return data.data ?? [];
  },

  async create(groupId: string, request: SaveGroupEventRequest & { conversationId: string }) {
    const { data } = await apiClient.post<ApiResponse<GroupEventResponse>>(`/groups/${groupId}/events`, request);
    return data.data;
  },

  async update(groupId: string, eventId: string, request: SaveGroupEventRequest) {
    const { conversationId: _conversationId, ...body } = request;
    const { data } = await apiClient.put<ApiResponse<GroupEventResponse>>(`/groups/${groupId}/events/${eventId}`, body);
    return data.data;
  },

  async cancel(groupId: string, eventId: string) {
    const { data } = await apiClient.delete<ApiResponse<GroupEventResponse>>(`/groups/${groupId}/events/${eventId}`);
    return data.data;
  },

  async rsvp(groupId: string, eventId: string, status: GroupEventRsvpStatus) {
    const { data } = await apiClient.put<ApiResponse<GroupEventResponse>>(
      `/groups/${groupId}/events/${eventId}/rsvp`,
      { status },
    );
    return data.data;
  },

  async updateSettings(groupId: string, membersCanCreateEvents: boolean) {
    await apiClient.put(`/groups/${groupId}/events/settings`, { membersCanCreateEvents });
  },
};
