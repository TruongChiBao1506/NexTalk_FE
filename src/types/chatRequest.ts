import type { User } from './auth';

export interface ChatRequestResponse {
  id: string;
  sender: User;
  receiver: User;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  conversationId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatRequestPayload {
  receiverId: string;
  message: string;
}
