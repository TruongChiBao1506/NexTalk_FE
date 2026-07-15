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

export interface SubtaskResponse {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface SubtaskRequest {
  id?: string;
  title: string;
  isCompleted?: boolean;
}

export type TaskActivityType =
  | 'TASK_CREATED'
  | 'STATUS_CHANGED'
  | 'SUBTASK_COMPLETED'
  | 'ASSIGNEE_UPDATED'
  | 'DUE_APPROACHING'
  | 'TASK_OVERDUE';

export interface TaskActivityResponse {
  id: string;
  groupId: string;
  channelId: string;
  taskId: string;
  actorId: string | null;
  actorUsername: string;
  actorAvatarUrl: string | null;
  type: TaskActivityType;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChannelTaskAssigneeResponse {
  userId: string;
  username: string;
  avatarUrl: string | null;
}

export interface TaskAttachmentResponse {
  id: string;
  url: string;
  name: string;
  type: string;
  size?: number | null;
}

export interface TaskAttachmentRequest {
  id?: string;
  url: string;
  name: string;
  type: string;
  size?: number | null;
}

export interface TaskSourceMessageResponse {
  messageId: string;
  conversationId: string;
  channelId: string;
  senderId?: string | null;
  senderUsername?: string | null;
  preview: string;
  createdAt: string;
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
  subtasks?: SubtaskResponse[];
  attachments?: TaskAttachmentResponse[];
  sourceMessage?: TaskSourceMessageResponse | null;
  isPinned?: boolean;
  pinnedAt?: string | null;
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
  subtasks?: SubtaskRequest[];
  attachments?: TaskAttachmentRequest[];
  sourceMessageId?: string;
}

export interface UpdateChannelTaskRequest {
  title?: string;
  description?: string;
  status?: ChannelTaskStatus;
  priority?: ChannelTaskPriority;
  dueAt?: string;
  assigneeIds?: string[];
  subtasks?: SubtaskRequest[];
  attachments?: TaskAttachmentRequest[];
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
