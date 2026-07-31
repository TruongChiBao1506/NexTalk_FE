export interface NotificationResponse {
  id: string;
  type: 'NEW_MESSAGE' | 'MENTION' | 'FRIEND_REQUEST' | 'GROUP_INVITE' | 'CHAT_REQUEST' | 'REMINDER' | 'TASK_ASSIGNED' | 'TASK_DUE' | 'TASK_UPDATED' | 'MISSED_CALL' | 'GROUP_EVENT_REMINDER';
  content: string;
  referenceId: string | null;
  secondaryReferenceId?: string | null;
  read: boolean; // Field name is 'read' in JSON from Jackson serialization
  actionStatus?: ActionItemStatus | null;
  snoozedUntil?: string | null;
  createdAt: string;
}

export type ActionItemStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';
