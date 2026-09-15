import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { env } from '../api/config';
import { tokenStorage } from '../api/tokenStorage';
import { chatService } from '../services/chatService';
import type { ConversationCreateRequest, Message } from '../types/chat';

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  messages: (conversationId: string, page: number) => [...chatKeys.all, 'messages', conversationId, page] as const,
};

export const useConversations = () =>
  useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: chatService.conversations,
  });

export const useMessages = (conversationId: string | null, page: number, size: number) =>
  useQuery({
    queryKey: chatKeys.messages(conversationId ?? '', page),
    queryFn: () => chatService.messages(conversationId!, page, size),
    enabled: Boolean(conversationId),
  });

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

export const useUploadChatAttachment = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => chatService.uploadAttachment(conversationId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.messages(conversationId, 0) }),
  });
};

export const useUpdateGroupAvatar = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => chatService.updateGroupAvatar(conversationId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.conversations() }),
  });
};

type UseChatSocketArgs = {
  conversationId: string | null;
  onMessage: (message: Message) => void;
  onError?: (message: string) => void;
};

export const useChatSocket = ({ conversationId, onMessage, onError }: UseChatSocketArgs) => {
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const accessToken = tokenStorage.getAccessToken();

    if (!accessToken) {
      return;
    }

    const client = new Client({
      brokerURL: env.chatWsUrl,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => undefined,
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onStompError: (frame) => onError?.(frame.headers.message ?? 'WebSocket STOMP error'),
      onWebSocketClose: () => setIsConnected(false),
      onWebSocketError: () => onError?.('Không thể kết nối WebSocket'),
    });

    clientRef.current = client;
    client.activate();

    return () => {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
      clientRef.current = null;
      setIsConnected(false);
      void client.deactivate();
    };
  }, [onError]);

  useEffect(() => {
    const client = clientRef.current;
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;

    if (!client || !conversationId || !client.connected) {
      return;
    }

    subscriptionRef.current = client.subscribe(`/topic/conversations/${conversationId}`, (message: IMessage) => {
      onMessage(JSON.parse(message.body) as Message);
    });

    return () => {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [conversationId, isConnected, onMessage]);

  const sendMessage = (content: string) => {
    const trimmed = content.trim();

    if (!trimmed || !conversationId || !clientRef.current?.connected) {
      return false;
    }

    clientRef.current.publish({
      destination: `/app/chat/${conversationId}`,
      body: JSON.stringify({ content: trimmed }),
    });
    return true;
  };

  return { isConnected, sendMessage };
};
