export type GroupRole = 'OWNER' | 'LEADER' | 'DEPUTY' | 'ADMIN' | 'MEMBER';
export type InvitationStatus = 'PENDING' | 'WAITING_APPROVAL';

export type ChannelType = 'TEXT' | 'FORUM' | 'VOICE';
export type ChannelTaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type ChannelTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ChannelResponse {
  id: string;
  name: string;
  type: ChannelType;
  isPrivate: boolean;
  isTaskEnabled?: boolean;
  groupId: string;
  conversationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelTaskAssigneeResponse {
  userId: string;
  username: string;
  avatarUrl: string | null;
}

export interface ChannelTaskResponse {
  id: string;
  groupId: string;
  channelId: string;
  title: string;
  description: string | null;
  status: ChannelTaskStatus;
  priority: ChannelTaskPriority;
  createdById: string;
  createdByUsername: string;
  assignees: ChannelTaskAssigneeResponse[];
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChannelTaskRequest {
  title: string;
  description?: string;
  status?: ChannelTaskStatus;
  priority?: ChannelTaskPriority;
  dueAt?: string;
  assigneeIds?: string[];
}

export interface UpdateChannelTaskRequest {
  title?: string;
  description?: string;
  status?: ChannelTaskStatus;
  priority?: ChannelTaskPriority;
  dueAt?: string;
  assigneeIds?: string[];
}

export interface GroupMemberResponse {
  userId: string;
  username: string;
  avatarUrl: string | null;
  role: GroupRole;
}

export interface GroupInvitationResponse {
  id: string;
  groupId: string;
  groupName: string;
  groupAvatarUrl: string | null;
  inviterId: string;
  inviterUsername: string;
  inviteeId: string;
  inviteeUsername: string;
  inviteeAvatarUrl?: string | null;
  status: InvitationStatus;
  createdAt: string;
}

export interface GroupResponse {
  id: string;
  name: string;
  avatarUrl: string | null;
  conversationId?: string | null;
  ownerId: string;
  ownerUsername: string;
  channels: ChannelResponse[];
  requiresApproval: boolean;
  isTaskEnabled: boolean;
  inviteCode: string;
  pendingApprovalCount?: number;
  members: GroupMemberResponse[];
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupRequest {
  name: string;
  memberIds: string[];
  requiresApproval?: boolean;
}

export interface UpdateGroupRequest {
  name?: string;
  avatarUrl?: string | null;
  requiresApproval?: boolean;
}

export interface PublicGroupInfoResponse {
  id: string;
  name: string;
  avatarUrl: string | null;
  ownerUsername: string;
  memberCount: number;
  requiresApproval: boolean;
}

export interface AddMemberRequest {
  userId: string;
}

export interface InviteUserRequest {
  userId: string;
}

export interface UpdateMemberRoleRequest {
  role: GroupRole;
}
