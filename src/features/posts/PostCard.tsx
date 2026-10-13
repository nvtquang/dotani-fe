import { Link } from 'react-router-dom';
import { Badge, Card, StatusBadge, Time, UserAvatar, cn } from '../../components/ui';
import type { PostEngagement } from '../../types/engagement';
import type { Post } from '../../types/post';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { postStatusLabel, postTypeLabel } from '../../utils/labels';
import { excerpt } from '../../utils/text';
import { ReactionBar } from './ReactionBar';

type PostCardProps = {
  post: Post;
  /** officers see drafts/archived labels; members only ever get published posts */
  showStatus?: boolean;
  /** reactions and comment count; the bar shows on published posts only */
  engagement?: PostEngagement;
  className?: string;
};

export const PostCard = ({ post, showStatus, engagement, className }: PostCardProps) => {
  const cover = post.images?.find((image) => (image.attachmentKind ?? 'IMAGE') === 'IMAGE');
  const coverUrl = resolveAssetUrl(cover?.imageUrl);

  return (
    <Card as="article" className={cn('relative overflow-hidden transition-shadow hover:shadow-md', className)}>
      <div className="p-4">
        <div className="flex items-center gap-2.5">
          <UserAvatar name={post.authorName ?? post.organizationName} size="sm" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-slate-900">{post.authorName ?? 'Ban chấp hành'}</p>
            <p className="truncate text-xs text-slate-600">
              {post.organizationName ?? 'Đoàn phường'} · <Time value={post.createdAt} relative />
            </p>
          </div>
          <Badge tone="gray">{postTypeLabel[post.type]}</Badge>
          {showStatus && post.status !== 'PUBLISHED' && <StatusBadge value={post.status} label={postStatusLabel[post.status]} />}
        </div>
        <h2 className="mt-3 text-base leading-snug font-semibold text-slate-900">
          <Link to={`/posts/${post.id}`} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-brand-600">
            {post.title}
          </Link>
        </h2>
        <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-slate-700">{excerpt(post.content, 320)}</p>
      </div>
      {coverUrl && (
        <img src={coverUrl} alt="" loading="lazy" decoding="async" className="aspect-[16/9] w-full border-t border-slate-200 bg-slate-100 object-cover" />
      )}
      {post.status === 'PUBLISHED' && <ReactionBar postId={post.id} engagement={engagement} commentsHref={`/posts/${post.id}#comments`} />}
    </Card>
  );
};
