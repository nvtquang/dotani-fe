import { httpClient } from '../api/httpClient';
import type { FeedKind, FeedPage, SearchResults } from '../types/feed';

export const feedService = {
  page: async (kind: FeedKind, before: string | null, size = 10) => {
    const { data } = await httpClient.get<FeedPage>('/api/feed', {
      params: { kind, size, before: before ?? undefined },
    });
    return data;
  },
  search: async (query: string, signal?: AbortSignal) => {
    const { data } = await httpClient.get<SearchResults>('/api/search', { params: { q: query }, signal });
    return data;
  },
};
