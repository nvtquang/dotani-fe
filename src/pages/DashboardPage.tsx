import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarPlus, FilePlus } from 'lucide-react';
import { Alert, Button, ButtonLink, Card, EmptyState, PageHeader, Skeleton, Tabs, type TabItem } from '../components/ui';
import { EventCard } from '../features/events/EventCard';
import { PostCard } from '../features/posts/PostCard';
import { useMyEventParticipations } from '../hooks/useEvents';
import { usePostEngagementMap } from '../hooks/useEngagement';
import { useFeed } from '../hooks/useFeed';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { isManager, isWardRole } from '../routes/navigation';
import { useAuth } from '../stores/AuthContext';
import type { FeedKind } from '../types/feed';

const tabs: TabItem<FeedKind>[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'EVENT', label: 'Sự kiện' },
  { value: 'POST', label: 'Bài viết' },
];

const FeedSkeleton = () => (
  <Card className="space-y-3 p-4" >
    <div className="flex gap-3">
      <Skeleton className="size-14 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  </Card>
);

export const DashboardPage = () => {
  const { role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const kind = (tabs.find((tab) => tab.value === searchParams.get('tab'))?.value ?? 'ALL') as FeedKind;
  const feed = useFeed(kind);
  const manager = isManager(role);
  const participations = useMyEventParticipations(role === 'MEMBER');
  const myStatusByEvent = useMemo(
    () => new Map((participations.data ?? []).map((participation) => [participation.eventId, participation.status])),
    [participations.data],
  );

  const items = feed.data?.pages.flatMap((page) => page.items) ?? [];
  const engagement = usePostEngagementMap(items.flatMap((item) => (item.kind === 'POST' && item.post.status === 'PUBLISHED' ? [item.post.id] : [])));
  const sentinelRef = useInfiniteScroll(() => {
    if (feed.hasNextPage && !feed.isFetchingNextPage) {
      void feed.fetchNextPage();
    }
  }, Boolean(feed.hasNextPage));

  return (
    <>
      <PageHeader
        title="Bảng tin"
        description="Sự kiện, thông báo và hoạt động mới nhất của Đoàn phường Thượng Cát"
        actions={
          manager && (
            <>
              <ButtonLink to="/events?create=1" variant="secondary">
                <CalendarPlus size={17} aria-hidden="true" />
                Tạo sự kiện
              </ButtonLink>
              {isWardRole(role) && (
                <ButtonLink to="/posts?create=1" variant="secondary">
                  <FilePlus size={17} aria-hidden="true" />
                  Tạo bài viết
                </ButtonLink>
              )}
            </>
          )
        }
      />

      <div className="mx-auto max-w-2xl">
        <Tabs
          label="Lọc bảng tin"
          idPrefix="feed-tab"
          items={tabs}
          value={kind}
          onChange={(value) => setSearchParams(value === 'ALL' ? {} : { tab: value }, { replace: true })}
        />

        <section role="tabpanel" aria-labelledby={`feed-tab-${kind}`} aria-busy={feed.isLoading} className="mt-4 flex flex-col gap-3">
          {feed.isLoading && Array.from({ length: 3 }).map((_, index) => <FeedSkeleton key={index} />)}

          {feed.isError && (
            <Alert>
              Không thể tải bảng tin.{' '}
              <button type="button" className="font-semibold underline" onClick={() => void feed.refetch()}>
                Thử lại
              </button>
            </Alert>
          )}

          {!feed.isLoading && !feed.isError && items.length === 0 && (
            <Card>
              <EmptyState
                title={kind === 'POST' ? 'Chưa có bài viết' : kind === 'EVENT' ? 'Chưa có sự kiện' : 'Bảng tin còn trống'}
                description="Nội dung mới từ Đoàn phường và tổ dân phố sẽ xuất hiện ở đây."
              />
            </Card>
          )}

          {items.map((item) =>
            item.kind === 'EVENT' ? (
              <EventCard key={`event-${item.event.id}`} event={item.event} showStatus={manager} myStatus={myStatusByEvent.get(item.event.id)} />
            ) : (
              <PostCard key={`post-${item.post.id}`} post={item.post} showStatus={manager} engagement={engagement[item.post.id]} />
            ),
          )}

          <div ref={sentinelRef} aria-hidden="true" />
          {feed.isFetchingNextPage && <FeedSkeleton />}
          {feed.hasNextPage && !feed.isFetchingNextPage && (
            <Button variant="secondary" className="self-center" onClick={() => void feed.fetchNextPage()}>
              Xem thêm
            </Button>
          )}
          {!feed.hasNextPage && items.length > 0 && <p className="py-4 text-center text-sm text-slate-600">Bạn đã xem hết bảng tin.</p>}
        </section>
      </div>
    </>
  );
};
