export type GroupRole = 'OWNER' | 'LEADER' | 'DEPUTY' | 'ADMIN' | 'MEMBER';

export interface GroupMemberResponse {
  userId: string;
  username: string;
  avatarUrl: string | null;
  role: GroupRole;
}

export interface GroupResponse {
  id: string;
  name: string;
  avatarUrl: string | null;
  ownerId: string;
  ownerUsername: string;
  conversationId: string | null;
  members: GroupMemberResponse[];
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupRequest {
  name: string;
  memberIds: string[];
}

export interface UpdateGroupRequest {
  name?: string;
  avatarUrl?: string | null;
}

export interface AddMemberRequest {
  userId: string;
}

export interface UpdateMemberRoleRequest {
  role: GroupRole;
}
