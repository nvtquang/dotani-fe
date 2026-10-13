import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { feedService } from '../services/feedService';
import type { FeedKind } from '../types/feed';

export const feedKeys = {
  all: ['feed'] as const,
  list: (kind: FeedKind) => [...feedKeys.all, kind] as const,
  search: (query: string) => ['search', query] as const,
};

export const useFeed = (kind: FeedKind) =>
  useInfiniteQuery({
    queryKey: feedKeys.list(kind),
    queryFn: ({ pageParam }) => feedService.page(kind, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

export const useSearch = (query: string) =>
  useQuery({
    queryKey: feedKeys.search(query),
    queryFn: ({ signal }) => feedService.search(query, signal),
    enabled: query.length >= 2,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
