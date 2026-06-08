export type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface GroupMemberResponse {
  userId: string;
  username: string;
  avatarUrl: string | null;
  role: GroupRole;
}

export interface GroupResponse {
  id: string;
  name: string;
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
  name: string;
}

export interface AddMemberRequest {
  userId: string;
}
