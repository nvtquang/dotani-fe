import type { Event } from './event';
import type { MemberDirectoryItem } from './member';
import type { Post } from './post';

export type FeedKind = 'ALL' | 'EVENT' | 'POST';

export type FeedItem =
  | { kind: 'EVENT'; createdAt: string; event: Event; post: null }
  | { kind: 'POST'; createdAt: string; event: null; post: Post };

export type FeedPage = {
  items: FeedItem[];
  /** pass as `before` for the next page; null when there is nothing older */
  nextCursor: string | null;
};

export type SearchResults = {
  members: MemberDirectoryItem[];
  events: Event[];
  posts: Post[];
};
