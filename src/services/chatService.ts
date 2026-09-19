import { httpClient } from '../api/httpClient';
import type { PageResponse } from '../types/api';
import type { Conversation, ConversationCreateRequest, Message } from '../types/chat';

export const chatService = {
  conversations: async () => {
    const { data } = await httpClient.get<Conversation[]>('/api/chat/conversations');
    return data;
  },
  conversation: async (id: string) => {
    const { data } = await httpClient.get<Conversation>(`/api/chat/conversations/${id}`);
    return data;
  },
  markRead: async (id: string) => {
    const { data } = await httpClient.patch<Conversation>(`/api/chat/conversations/${id}/read`);
    return data;
  },
  messages: async (id: string, page: number, size: number) => {
    const { data } = await httpClient.get<PageResponse<Message>>(`/api/chat/conversations/${id}/messages`, {
      params: {
        page,
        size,
        sort: 'createdAt,desc',
      },
    });
    return data;
  },
  createConversation: async (payload: ConversationCreateRequest) => {
    const { data } = await httpClient.post<Conversation>('/api/chat/conversations', payload);
    return data;
  },
  addMember: async (conversationId: string, memberId: string) => {
    const { data } = await httpClient.post<Conversation>(`/api/chat/conversations/${conversationId}/members`, {
      memberId,
    });
    return data;
  },
  removeMember: async (conversationId: string, memberId: string) => {
    await httpClient.delete(`/api/chat/conversations/${conversationId}/members/${memberId}`);
  },
  uploadAttachment: async (conversationId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await httpClient.post<Message>(`/api/chat/conversations/${conversationId}/messages/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  updateGroupAvatar: async (conversationId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await httpClient.patch<Conversation>(`/api/chat/conversations/${conversationId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
