import type { User } from './auth';

export interface ConversationResponse {
  id: string;
  type: 'PRIVATE' | 'GROUP';
  name: string | null;
  canSendMessages?: boolean;
  blockedByMe?: boolean;
  blockedMe?: boolean;
  pinned?: boolean;
  hidden?: boolean;
  selfDestructSeconds?: number;
  members: User[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageRequest {
  conversationId: string;
  content: string;
  messageType?: MessageType;
  attachments?: MessageAttachment[];
  parentId?: string;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'ALBUM' | 'POLL' | 'SYSTEM';

export interface MessageAttachment {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'FILE';
  name?: string | null;
}

export interface MessageStatusResponse {
  userId: string;
  username: string;
  status: 'SENT' | 'DELIVERED' | 'SEEN';
  updatedAt: string;
}

export interface MessageStatusUpdateResponse {
  type: 'STATUS_UPDATE';
  conversationId: string;
  userId: string;
  username: string;
  status: 'DELIVERED' | 'SEEN';
  updatedAt: string;
}

export interface MessageReaction {
  userId: string;
  username: string;
  emoji: string;
}

export interface CallHistoryParticipant {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

export interface CallHistoryMetadata {
  systemType?: 'CALL_HISTORY' | string;
  callId?: string;
  conversationId?: string;
  callScope?: 'GROUP' | 'PRIVATE' | string;
  callType?: 'VOICE' | 'VIDEO' | string;
  status?: 'MISSED' | 'REJECTED' | 'CANCELED' | 'ENDED' | string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  participantCount?: number;
  participants?: CallHistoryParticipant[];
}

export interface PollVoter {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

export interface PollOption {
  id: string;
  text: string;
  createdById?: string;
  createdByName?: string;
  voterIds?: string[];
  voters?: PollVoter[];
}

export interface PollMetadata {
  systemType?: 'POLL' | string;
  question?: string;
  allowMultiple?: boolean;
  allowAddOptions?: boolean;
  anonymous?: boolean;
  locked?: boolean;
  expiresAt?: string | null;
  lockedAt?: string | null;
  creatorId?: string;
  creatorName?: string;
  options?: PollOption[];
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  messageType: MessageType;
  attachments?: MessageAttachment[];
  createdAt: string;
  statuses?: MessageStatusResponse[];
  parentId?: string | null;
  forwardedFromMessageId?: string | null;
  forwardedFromSenderUsername?: string | null;
  isEdited?: boolean;
  editedAt?: string | null;
  isRecalled?: boolean;
  isPinned?: boolean;
  pinnedAt?: string | null;
  expiresAt?: string | null;
  reactions?: MessageReaction[];
  metadata?: CallHistoryMetadata | PollMetadata | Record<string, unknown>;
}

export interface ConversationSummaryResponse {
  type: 'CONVERSATION_SUMMARY';
  conversationId: string;
  summary: string;
  sourceMessageCount: number;
  createdAt: string;
}
