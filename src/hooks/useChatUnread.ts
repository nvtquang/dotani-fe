import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { chatKeys, useChatOverviewSocket, useConversations } from './useChat';
import { useAuth } from '../stores/AuthContext';
import type { Message } from '../types/chat';

type UseChatUnreadOptions = {
  enabled?: boolean;
};

export const useChatUnread = ({ enabled = true }: UseChatUnreadOptions = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const conversationsQuery = useConversations();
  const conversations = conversationsQuery.data ?? [];
  const conversationIds = useMemo(() => conversations.map((conversation) => conversation.id), [conversations]);

  const handleMessage = useCallback(
    (message: Message) => {
      if (!user?.memberId || message.senderId === user.memberId) {
        return;
      }

      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
    [queryClient, user?.memberId],
  );

  useChatOverviewSocket({
    conversationIds: enabled ? conversationIds : [],
    onMessage: handleMessage,
  });

  return {
    unreadByConversation: Object.fromEntries(
      conversations.map((conversation) => [conversation.id, conversation.unreadCount ?? 0]),
    ),
    totalUnread: conversations.reduce((total, conversation) => total + (conversation.unreadCount ?? 0), 0),
  };
};
