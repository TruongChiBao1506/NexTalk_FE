export interface NotificationResponse {
  id: string;
  type: 'NEW_MESSAGE' | 'FRIEND_REQUEST' | 'GROUP_INVITE';
  content: string;
  referenceId: string | null;
  read: boolean; // Field name is 'read' in JSON from Jackson serialization
  createdAt: string;
}
