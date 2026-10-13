import { useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engagementService } from '../services/engagementService';
import type { PostEngagement, ReactionType } from '../types/engagement';

export const engagementKeys = {
  all: ['engagement'] as const,
  lookup: (ids: string[]) => [...engagementKeys.all, 'lookup', ids] as const,
  comments: (postId: string) => [...engagementKeys.all, 'comments', postId] as const,
};

/** Reactions and comment counts of many posts in one request (a page of the feed). */
export const usePostEngagementMap = (postIds: string[]) => {
  const ids = Array.from(new Set(postIds)).sort();
  const { data } = useQuery({
    queryKey: engagementKeys.lookup(ids),
    queryFn: () => engagementService.lookup(ids),
    enabled: ids.length > 0,
    staleTime: 30_000,
  });
  return useMemo(() => Object.fromEntries((data ?? []).map((item) => [item.postId, item])) as Record<string, PostEngagement>, [data]);
};

export const useReact = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (type: ReactionType | null) => (type ? engagementService.react(postId, type) : engagementService.unreact(postId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: engagementKeys.all }),
  });
};

export const useComments = (postId: string, enabled = true) =>
  useInfiniteQuery({
    queryKey: engagementKeys.comments(postId),
    queryFn: ({ pageParam }) => engagementService.comments(postId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.number + 1 < last.totalPages ? last.number + 1 : undefined),
    enabled,
  });

export const useCommentMutations = (postId: string) => {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: engagementKeys.all });
  return {
    add: useMutation({ mutationFn: (content: string) => engagementService.addComment(postId, content), onSuccess: refresh }),
    edit: useMutation({
      mutationFn: ({ id, content }: { id: string; content: string }) => engagementService.editComment(postId, id, content),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: (id: string) => engagementService.deleteComment(postId, id), onSuccess: refresh }),
  };
};
