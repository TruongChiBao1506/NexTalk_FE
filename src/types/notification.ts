export interface NotificationResponse {
  id: string;
  type: 'NEW_MESSAGE' | 'MENTION' | 'FRIEND_REQUEST' | 'GROUP_INVITE' | 'CHAT_REQUEST' | 'REMINDER';
  content: string;
  referenceId: string | null;
  read: boolean; // Field name is 'read' in JSON from Jackson serialization
  createdAt: string;
}
