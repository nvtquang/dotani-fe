export type NotificationType =
  | 'EVENT_NEW'
  | 'EVENT_UPDATED'
  | 'EVENT_CANCELLED'
  | 'EVENT_DEADLINE'
  | 'NEW_TASK'
  | 'MEETING_SCHEDULE'
  | 'CONGRESS'
  | 'POST_NEW'
  | 'SYSTEM';

export type NotificationReferenceType = 'EVENT' | 'TASK' | 'POST' | 'SYSTEM';

export type Notification = {
  id: string;
  userNotificationId: string;
  notificationType: NotificationType;
  title: string;
  content: string;
  referenceType: NotificationReferenceType;
  referenceId: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationFilters = {
  page: number;
  size: number;
};

export type UnreadCount = {
  count: number;
};
