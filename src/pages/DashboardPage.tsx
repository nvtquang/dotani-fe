import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { CalendarDays, FileText, MapPin, MessageCircle, Plus, UsersRound } from 'lucide-react';
import { Card, EmptyState, LoadingSkeleton, PageHeader, StatusBadge, UserAvatar } from '../components/ui';
import { useEvents } from '../hooks/useEvents';
import { useMyProfile } from '../hooks/useMembers';
import { usePosts } from '../hooks/usePosts';
import { eventService } from '../services/eventService';
import { useAuth } from '../stores/AuthContext';
import type { Event } from '../types/event';
import type { Post } from '../types/post';
import { eventStatusLabel, eventTypeLabel, postStatusLabel, postTypeLabel, roleLabel } from '../utils/labels';
import { formatDateTime } from '../utils/dateTime';
import { resolveAssetUrl } from '../utils/assetUrl';

const wardRoles = new Set(['WARD_SECRETARY', 'WARD_DEPUTY_SECRETARY']);

type FeedSort = 'newest' | 'oldest' | 'engagement';

type FeedItem = {
  id: string;
  kind: 'event' | 'post';
  title: string;
  description?: string | null;
  meta: string;
  location?: string | null;
  time?: string;
  sortTime?: string;
  to: string;
  status: string;
  statusLabel: string;
  engagement: number;
  engagementLabel: string;
};

const getPostEngagement = (post: Post) => {
  const maybePost = post as Post & {
    interactionCount?: number;
    viewCount?: number;
    commentCount?: number;
    reactionCount?: number;
  };

  return maybePost.interactionCount ?? maybePost.reactionCount ?? maybePost.commentCount ?? maybePost.viewCount ?? 0;
};

const buildFeed = (
  events: Event[],
  posts: Post[],
  eventParticipationCounts: Record<string, number>,
  sort: FeedSort,
): FeedItem[] => {
  const items: FeedItem[] = [
    ...events.map((event) => {
      const goingCount = eventParticipationCounts[event.id] ?? 0;

      return {
        id: `event-${event.id}`,
        kind: 'event' as const,
        title: event.title,
        description: event.description,
        meta: eventTypeLabel[event.type],
        location: event.location,
        time: event.startTime,
        sortTime: event.createdAt ?? event.startTime,
        to: `/events/${event.id}`,
        status: event.status,
        statusLabel: eventStatusLabel[event.status],
        engagement: goingCount,
        engagementLabel: `${goingCount} lượt tham gia`,
      };
    }),
    ...posts.map((post) => {
      const engagement = getPostEngagement(post);

      return {
        id: `post-${post.id}`,
        kind: 'post' as const,
        title: post.title,
        description: post.content,
        meta: postTypeLabel[post.type],
        time: post.createdAt,
        sortTime: post.createdAt,
        to: `/posts/${post.id}`,
        status: post.status,
        statusLabel: postStatusLabel[post.status],
        engagement,
        engagementLabel: `${engagement} lượt tương tác`,
      };
    }),
  ];

  return items.sort((left, right) => {
    if (sort === 'engagement') {
      const engagementDiff = right.engagement - left.engagement;
      if (engagementDiff !== 0) {
        return engagementDiff;
      }
    }

    const leftTime = left.sortTime ? new Date(left.sortTime).getTime() : 0;
    const rightTime = right.sortTime ? new Date(right.sortTime).getTime() : 0;
    return sort === 'oldest' ? leftTime - rightTime : rightTime - leftTime;
  });
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const profileQuery = useMyProfile(Boolean(user?.memberId));
  const profile = profileQuery.data;
  const displayName = profile?.fullName ?? user?.username;
  const avatarUrl = resolveAssetUrl(profile?.avatarUrl);
  const [feedSort, setFeedSort] = useState<FeedSort>('newest');
  const eventsQuery = useEvents({ page: 0, size: 40, upcoming: false, sort: 'createdAt,desc' });
  const postsQuery = usePosts({ page: 0, size: 40 });
  const events = eventsQuery.data?.content ?? [];
  const posts = postsQuery.data?.content ?? [];
  const isWard = Boolean(user?.role && wardRoles.has(user.role));

  const participationQueries = useQueries({
    queries: events.map((event) => ({
      queryKey: ['events', 'dashboard-feed', event.id, 'participation-summary'] as const,
      queryFn: () => eventService.participationSummary(event.id),
      enabled: Boolean(event.id),
      staleTime: 60_000,
    })),
  });

  const eventParticipationCounts = useMemo(
    () =>
      events.reduce<Record<string, number>>((accumulator, event, index) => {
        accumulator[event.id] = participationQueries[index]?.data?.going ?? 0;
        return accumulator;
      }, {}),
    [events, participationQueries],
  );

  const feed = useMemo(
    () => buildFeed(events, posts, eventParticipationCounts, feedSort),
    [eventParticipationCounts, events, posts, feedSort],
  );

  const isLoading = eventsQuery.isLoading || postsQuery.isLoading;
  const isError = eventsQuery.isError || postsQuery.isError;

  return (
    <div className="dashboard-feed-shell">
      <PageHeader
        eyebrow="Tổng quan"
        title="Bảng tin hoạt động"
        actions={
          isWard && (
            <>
              <Link className="secondary-button inline-button" to="/events">
                <CalendarDays size={17} aria-hidden="true" />
                Quản lý sự kiện
              </Link>
              <Link className="secondary-button inline-button" to="/posts">
                <FileText size={17} aria-hidden="true" />
                Quản lý bài viết
              </Link>
            </>
          )
        }
      />

      <div className={isWard ? 'feed-layout' : 'feed-layout feed-layout-readable'}>
        <aside className="feed-rail">
          <Link className="feed-profile-link" to="/profile" title="Mở hồ sơ cá nhân">
          <Card className="feed-profile-card">
            <UserAvatar name={displayName} src={avatarUrl} size="md" />
            <div>
              <strong>{displayName ?? 'DOTANI'}</strong>
              <span>{user?.role ? roleLabel[user.role] : 'Đoàn viên'}</span>
            </div>
          </Card>
          </Link>
          <Card className="feed-filter-card">
            <span>Sắp xếp bảng tin</span>
            <button className={feedSort === 'newest' ? 'feed-sort active' : 'feed-sort'} type="button" onClick={() => setFeedSort('newest')}>
              Mới nhất
            </button>
            <button className={feedSort === 'oldest' ? 'feed-sort active' : 'feed-sort'} type="button" onClick={() => setFeedSort('oldest')}>
              Lâu nhất
            </button>
            <button className={feedSort === 'engagement' ? 'feed-sort active' : 'feed-sort'} type="button" onClick={() => setFeedSort('engagement')}>
              Nhiều tương tác
            </button>
          </Card>
        </aside>

        <section className="feed-column">
          <Card className="feed-composer">
            <UserAvatar name={displayName} src={avatarUrl} size="sm" />
            <div>
              <strong>Bảng tin Phường Thượng Cát</strong>
              <span>Sự kiện, thông báo và báo cáo hoạt động mới nhất</span>
            </div>
          </Card>

          {isLoading && <Card><LoadingSkeleton rows={7} /></Card>}
          {isError && <div className="error-box">Không thể tải bảng tin. Vui lòng thử lại sau.</div>}
          {!isLoading && !isError && feed.length === 0 && <EmptyState title="Chưa có sự kiện hoặc bài viết" />}

          {!isLoading && !isError && feed.length > 0 && (
            <div className="feed-list social-feed-list">
              {feed.map((item) => (
                <Link className="feed-item social-feed-item" key={item.id} to={item.to}>
                  <div className="feed-card-header">
                    <div className={`feed-icon feed-icon-${item.kind}`}>
                      {item.kind === 'event' ? (
                        <CalendarDays size={20} aria-hidden="true" />
                      ) : (
                        <FileText size={20} aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <strong>{item.kind === 'event' ? 'Sự kiện' : 'Bài viết'}</strong>
                      <span>
                        {item.meta}
                        {item.time ? ` · ${formatDateTime(item.time)}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="feed-body">
                    <h2>{item.title}</h2>
                    {item.description && <p>{item.description}</p>}
                  </div>

                  <div className="feed-footer">
                    <StatusBadge value={item.status} label={item.statusLabel} />
                    {item.location && (
                      <span>
                        <MapPin size={15} aria-hidden="true" />
                        {item.location}
                      </span>
                    )}
                    <span>
                      {item.kind === 'event' ? (
                        <UsersRound size={15} aria-hidden="true" />
                      ) : (
                        <MessageCircle size={15} aria-hidden="true" />
                      )}
                      {item.engagementLabel}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {isWard && (
          <aside className="feed-rail feed-action-rail">
            <Card className="feed-filter-card">
              <span>Thao tác nhanh</span>
              <Link className="feed-sort" to="/events">
                <Plus size={15} aria-hidden="true" />
                Tạo sự kiện
              </Link>
              <Link className="feed-sort" to="/posts">
                <Plus size={15} aria-hidden="true" />
                Tạo bài viết
              </Link>
            </Card>
          </aside>
        )}
      </div>
    </div>
  );
};
