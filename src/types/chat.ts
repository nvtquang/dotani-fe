export type ConversationType = 'DIRECT' | 'GROUP';

export type Conversation = {
  id: string;
  type: ConversationType;
  title?: string | null;
  avatarUrl?: string | null;
  createdBy?: string | null;
  memberIds: string[];
  memberNames?: Record<string, string>;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  unreadCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ConversationCreateRequest = {
  type: ConversationType;
  title?: string;
  memberIds: string[];
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string | null;
  content: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentContentType?: string | null;
  attachmentSize?: number | null;
  attachmentKind?: 'IMAGE' | 'FILE' | null;
  createdAt: string;
};
