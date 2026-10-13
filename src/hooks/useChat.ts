import { useCallback, useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { chatSocket, useTopic } from '../api/chatSocket';
import { chatService } from '../services/chatService';
import { useAuth } from '../stores/AuthContext';
import type { PageResponse } from '../types/api';
import type { ChatReadEvent, ChatTypingEvent, Conversation, ConversationCreateRequest, Message } from '../types/chat';

const HISTORY_PAGE_SIZE = 30;

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  messages: (conversationId: string) => [...chatKeys.all, 'messages', conversationId] as const,
};

type MessagePages = InfiniteData<PageResponse<Message>, number>;

export const useConversations = () =>
  useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: chatService.conversations,
  });

/** Newest page first (as the API sorts createdAt desc); fetchNextPage loads older history. */
export const useMessages = (conversationId: string | null) =>
  useInfiniteQuery({
    queryKey: chatKeys.messages(conversationId ?? ''),
    queryFn: ({ pageParam }) => chatService.messages(conversationId!, pageParam, HISTORY_PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.number + 1 < last.totalPages ? last.number + 1 : undefined),
    enabled: Boolean(conversationId),
  });

/** Puts a message into the cached history (no-op if it is already there). */
const addMessageToCache = (queryClient: ReturnType<typeof useQueryClient>, message: Message) => {
  queryClient.setQueryData<MessagePages>(chatKeys.messages(message.conversationId), (current) => {
    if (!current || current.pages.some((page) => page.content.some((item) => item.id === message.id))) {
      return current;
    }
    const [first, ...rest] = current.pages;
    return { ...current, pages: [{ ...first, content: [message, ...first.content] }, ...rest] };
  });
};

const replaceConversation = (queryClient: ReturnType<typeof useQueryClient>, conversation: Conversation) =>
  queryClient.setQueryData<Conversation[]>(chatKeys.conversations(), (current) =>
    current?.map((item) => (item.id === conversation.id ? conversation : item)),
  );

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConversationCreateRequest) => chatService.createConversation(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.conversations() }),
  });
};

export const useAddConversationMember = (conversationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => chatService.addMember(conversationId, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.conversations() }),
  });
};

export const useRemoveConversationMember = (conversationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => chatService.removeMember(conversationId, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.conversations() }),
  });
};

export const useMarkConversationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => chatService.markRead(conversationId),
    onSuccess: (conversation) => {
      replaceConversation(queryClient, conversation);
      // a list refetch started by the incoming message may have read the old unread count; redo it
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
};

export const useUploadChatAttachment = (conversationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => chatService.uploadAttachment(conversationId, file),
    onSuccess: (message) => {
      addMessageToCache(queryClient, message);
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
};

export const useUpdateGroupAvatar = (conversationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => chatService.updateGroupAvatar(conversationId, file),
    onSuccess: (conversation) => replaceConversation(queryClient, conversation),
  });
};

/**
 * App-wide: listens on every conversation the user belongs to and refreshes the list
 * (order, previews, unread badges) when something arrives. Mounted once in the layout.
 */
export const useChatInbox = () => {
  const queryClient = useQueryClient();
  const { data: conversations = [] } = useConversations();
  const ids = conversations.map((conversation) => conversation.id).sort().join('|');

  useEffect(() => {
    if (!ids) {
      return;
    }
    const onMessage = (body: unknown) => {
      addMessageToCache(queryClient, body as Message);
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    };
    const unsubscribers = ids.split('|').map((id) => chatSocket.subscribe(`/topic/conversations/${id}`, onMessage));
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [ids, queryClient]);

  return {
    conversations,
    totalUnread: conversations.reduce((total, conversation) => total + (conversation.unreadCount ?? 0), 0),
  };
};

/** The open conversation: marks incoming messages read and keeps "seen" states live. */
export const useConversationRealtime = (conversationId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const markRead = useMarkConversationRead();
  const markReadRef = useRef(markRead.mutate);
  markReadRef.current = markRead.mutate;

  useEffect(() => {
    if (conversationId) {
      markReadRef.current(conversationId);
    }
  }, [conversationId]);

  useTopic<Message>(conversationId ? `/topic/conversations/${conversationId}` : null, (message) => {
    if (message.senderId !== user?.memberId && document.visibilityState === 'visible') {
      markReadRef.current(message.conversationId);
    }
  });

  useTopic<ChatReadEvent>(conversationId ? `/topic/conversations/${conversationId}/read` : null, (event) => {
    queryClient.setQueryData<Conversation[]>(chatKeys.conversations(), (current) =>
      current?.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, readStates: { ...conversation.readStates, [event.memberId]: event.lastReadAt } }
          : conversation,
      ),
    );
  });

  const send = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      return Boolean(trimmed && conversationId) && chatSocket.publish(`/app/chat/${conversationId}`, { content: trimmed });
    },
    [conversationId],
  );

  return { send };
};

const TYPING_SHOWN_MS = 4000;
const TYPING_THROTTLE_MS = 2500;

/** Who else is typing in the conversation, and a notifier to call on every keystroke. */
export const useTypingIndicator = (conversationId: string | null) => {
  const { user } = useAuth();
  const [typing, setTyping] = useState<Record<string, { name: string; until: number }>>({});
  const lastSentRef = useRef(0);

  useEffect(() => setTyping({}), [conversationId]);

  useTopic<ChatTypingEvent>(conversationId ? `/topic/conversations/${conversationId}/typing` : null, (event) => {
    if (event.memberId === user?.memberId) {
      return;
    }
    setTyping((current) => ({
      ...current,
      [event.memberId]: { name: event.memberName ?? 'Ai đó', until: Date.now() + TYPING_SHOWN_MS },
    }));
  });

  // a new message from someone ends their typing state
  useTopic<Message>(conversationId ? `/topic/conversations/${conversationId}` : null, (message) => {
    setTyping((current) => {
      if (!current[message.senderId]) {
        return current;
      }
      const { [message.senderId]: _removed, ...rest } = current;
      return rest;
    });
  });

  const hasTyping = Object.keys(typing).length > 0;
  useEffect(() => {
    if (!hasTyping) {
      return;
    }
    const timer = window.setInterval(() => {
      const now = Date.now();
      setTyping((current) => {
        const next = Object.fromEntries(Object.entries(current).filter(([, value]) => value.until > now));
        return Object.keys(next).length === Object.keys(current).length ? current : next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [hasTyping]);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (!conversationId || now - lastSentRef.current < TYPING_THROTTLE_MS) {
      return;
    }
    lastSentRef.current = now;
    chatSocket.publish(`/app/chat/${conversationId}/typing`, {});
  }, [conversationId]);

  return { typingNames: Object.values(typing).map((value) => value.name), notifyTyping };
};
