import { httpClient } from '../api/httpClient';
import type { PageResponse } from '../types/api';
import type { PostComment, PostEngagement, ReactionType } from '../types/engagement';

export const engagementService = {
  lookup: async (postIds: string[]) => {
    const { data } = await httpClient.post<PostEngagement[]>('/api/posts/engagement', { postIds });
    return data;
  },
  react: async (postId: string, type: ReactionType) => {
    const { data } = await httpClient.put<PostEngagement>(`/api/posts/${postId}/reaction`, { type });
    return data;
  },
  unreact: async (postId: string) => {
    const { data } = await httpClient.delete<PostEngagement>(`/api/posts/${postId}/reaction`);
    return data;
  },
  comments: async (postId: string, page: number, size = 20) => {
    const { data } = await httpClient.get<PageResponse<PostComment>>(`/api/posts/${postId}/comments`, { params: { page, size } });
    return data;
  },
  addComment: async (postId: string, content: string) => {
    const { data } = await httpClient.post<PostComment>(`/api/posts/${postId}/comments`, { content });
    return data;
  },
  editComment: async (postId: string, commentId: string, content: string) => {
    const { data } = await httpClient.put<PostComment>(`/api/posts/${postId}/comments/${commentId}`, { content });
    return data;
  },
  deleteComment: async (postId: string, commentId: string) => {
    await httpClient.delete(`/api/posts/${postId}/comments/${commentId}`);
  },
};
