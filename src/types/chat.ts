import type { User } from './auth';

export interface ConversationResponse {
  id: string;
  type: 'PRIVATE' | 'GROUP';
  name: string | null;
  members: User[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageRequest {
  conversationId: string;
  content: string;
  messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';
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

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';
  createdAt: string;
  statuses?: MessageStatusResponse[];
}
