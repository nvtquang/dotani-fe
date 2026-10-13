export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD';

export type PostEngagement = {
  postId: string;
  reactionCounts: Partial<Record<ReactionType, number>>;
  totalReactions: number;
  myReaction?: ReactionType | null;
  commentCount: number;
};

export type PostComment = {
  id: string;
  postId: string;
  authorId: string;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  edited: boolean;
  canEdit: boolean;
  canDelete: boolean;
};
