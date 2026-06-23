export interface FriendResponse {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  status: string;
  lastSeen?: string;
  createdAt: string;
}

export interface FriendshipRequest {
  receiverId: string;
}

export interface FriendshipAcceptRequest {
  senderId: string;
}

export interface FriendshipAcceptResponse {
  conversationId: string;
}

export interface FriendSuggestionResponse {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  status: string;
  lastSeen?: string;
  mutualFriendsCount: number;
  isRequestSent: boolean;
}

export type FriendRelationStatus =
  | 'SELF'
  | 'NONE'
  | 'FRIENDS'
  | 'OUTGOING_PENDING'
  | 'INCOMING_PENDING'
  | 'REJECTED'
  | 'BLOCKED';

export interface FriendRelationStatusResponse {
  userId: string;
  status: FriendRelationStatus;
}
