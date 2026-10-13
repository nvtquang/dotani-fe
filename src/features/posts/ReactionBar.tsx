import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, ThumbsUp } from 'lucide-react';
import { cn, useToast } from '../../components/ui';
import { useReact } from '../../hooks/useEngagement';
import type { PostEngagement, ReactionType } from '../../types/engagement';
import { toApiError } from '../../utils/apiError';
import { reactionLabel } from '../../utils/labels';

const reactions = Object.keys(reactionLabel) as ReactionType[];

type ReactionBarProps = {
  postId: string;
  engagement?: PostEngagement;
  /** the comments link: on the feed it opens the post, on the post page it jumps to the comment box */
  commentsHref?: string;
  className?: string;
};

/** Reaction summary, a reaction button with the other reactions on demand, and the comment count. */
export const ReactionBar = ({ postId, engagement, commentsHref, className }: ReactionBarProps) => {
  const toast = useToast();
  const react = useReact(postId);
  const [picking, setPicking] = useState(false);
  const mine = engagement?.myReaction ?? null;
  const total = engagement?.totalReactions ?? 0;
  const top = reactions
    .filter((type) => (engagement?.reactionCounts[type] ?? 0) > 0)
    .sort((left, right) => (engagement?.reactionCounts[right] ?? 0) - (engagement?.reactionCounts[left] ?? 0))
    .slice(0, 3);

  const choose = (type: ReactionType | null) => {
    setPicking(false);
    react.mutate(type, { onError: (caught) => toast.error(toApiError(caught).message ?? 'Không bày tỏ được cảm xúc') });
  };

  return (
    // above the card's full-size link so the buttons stay clickable
    <div className={cn('relative z-10 border-t border-slate-200 px-2 py-1', className)}>
      {(total > 0 || (engagement?.commentCount ?? 0) > 0) && (
        <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-600">
          <span className="flex items-center gap-1" title={top.map((type) => `${reactionLabel[type].label}: ${engagement?.reactionCounts[type]}`).join(', ')}>
            {top.map((type) => (
              <span key={type} aria-hidden="true">
                {reactionLabel[type].emoji}
              </span>
            ))}
            {total > 0 && <span>{total}</span>}
          </span>
          {(engagement?.commentCount ?? 0) > 0 && <span>{engagement?.commentCount} bình luận</span>}
        </div>
      )}
      <div className="relative flex items-center gap-1">
        <button
          type="button"
          aria-pressed={Boolean(mine)}
          disabled={react.isPending}
          onClick={() => choose(mine ? null : 'LIKE')}
          className={cn(
            'inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold hover:bg-slate-100',
            mine ? 'text-brand-700' : 'text-slate-700',
          )}
        >
          {mine ? <span aria-hidden="true">{reactionLabel[mine].emoji}</span> : <ThumbsUp size={16} aria-hidden="true" />}
          {mine ? reactionLabel[mine].label : 'Thích'}
        </button>
        <button
          type="button"
          aria-expanded={picking}
          aria-label="Chọn cảm xúc khác"
          onClick={() => setPicking((value) => !value)}
          className="inline-flex h-9 items-center rounded-lg px-2 text-base hover:bg-slate-100"
        >
          <span aria-hidden="true">😊</span>
        </button>
        {commentsHref && (
          <Link
            to={commentsHref}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <MessageCircle size={16} aria-hidden="true" />
            Bình luận
          </Link>
        )}
        {picking && (
          <div role="group" aria-label="Cảm xúc" className="absolute bottom-full left-0 mb-1 flex gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-overlay">
            {reactions.map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={mine === type}
                aria-label={reactionLabel[type].label}
                title={reactionLabel[type].label}
                onClick={() => choose(mine === type ? null : type)}
                className={cn('size-10 rounded-full text-xl transition-transform hover:scale-125', mine === type && 'bg-brand-50')}
              >
                {reactionLabel[type].emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
