import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ArrowRightLeft, Bell, CalendarDays, CheckCheck, FileText, Megaphone, Vote, Wallet } from 'lucide-react';
import { Alert, Button, Card, EmptyState, LoadingSkeleton, PageHeader, Time, cn, useToast } from '../components/ui';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { notificationKeys, useMarkAllNotificationsRead, useMarkNotificationRead, useUnreadNotifications } from '../hooks/useNotifications';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../types/notification';
import { toApiError } from '../utils/apiError';

const typeLabel: Record<Notification['notificationType'], string> = {
  EVENT_NEW: 'Sự kiện mới',
  EVENT_UPDATED: 'Sự kiện thay đổi',
  EVENT_CANCELLED: 'Sự kiện bị hủy',
  EVENT_DEADLINE: 'Sắp hết hạn đăng ký',
  NEW_TASK: 'Công việc mới',
  MEETING_SCHEDULE: 'Lịch họp',
  CONGRESS: 'Đại hội',
  POST_NEW: 'Bài viết mới',
  SYSTEM: 'Hệ thống',
  FEE_REMINDER: 'Nhắc đoàn phí',
  TRANSFER_REQUESTED: 'Đề nghị chuyển sinh hoạt',
  TRANSFER_DECIDED: 'Kết quả chuyển sinh hoạt',
  POST_COMMENT: 'Bình luận mới',
  POLL_OPENED: 'Biểu quyết mới',
};

const typeIcon = (type: Notification['notificationType']) => {
  if (type === 'POST_NEW' || type === 'POST_COMMENT') return FileText;
  if (type === 'SYSTEM') return Megaphone;
  if (type === 'FEE_REMINDER') return Wallet;
  if (type.startsWith('TRANSFER')) return ArrowRightLeft;
  if (type === 'POLL_OPENED') return Vote;
  return type.startsWith('EVENT') || type === 'MEETING_SCHEDULE' || type === 'CONGRESS' ? CalendarDays : Bell;
};

const referencePath = (notification: Notification) => {
  if (!notification.referenceId) return null;
  if (notification.referenceType === 'EVENT' || notification.referenceType === 'TASK') return `/events/${notification.referenceId}`;
  if (notification.referenceType === 'POST') return `/posts/${notification.referenceId}`;
  if (notification.referenceType === 'FEE_PERIOD') return `/fees/${notification.referenceId}`;
  if (notification.referenceType === 'TRANSFER') return '/transfers';
  if (notification.referenceType === 'POLL') return `/polls/${notification.referenceId}`;
  return null;
};

export const NotificationPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const unreadCount = useUnreadNotifications().data?.count ?? 0;
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const query = useInfiniteQuery({
    queryKey: [...notificationKeys.all, 'infinite'],
    queryFn: ({ pageParam }) => notificationService.list({ page: pageParam, size: 15 }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.number + 1 < last.totalPages ? last.number + 1 : undefined),
  });
  const notifications = query.data?.pages.flatMap((page) => page.content) ?? [];
  const sentinelRef = useInfiniteScroll(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  }, Boolean(query.hasNextPage));

  const openNotification = (notification: Notification) => {
    if (!notification.read) {
      markRead.mutate(notification.userNotificationId, { onError: (caught) => toast.error(toApiError(caught).message ?? 'Không thể đánh dấu đã đọc') });
    }
    const path = referencePath(notification);
    if (path) navigate(path);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Thông báo"
        description={unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Bạn đã đọc hết thông báo'}
        actions={
          <Button
            variant="secondary"
            disabled={unreadCount === 0}
            loading={markAllRead.isPending}
            onClick={() => markAllRead.mutate(undefined, { onError: (caught) => toast.error(toApiError(caught).message ?? 'Không thể đánh dấu tất cả') })}
          >
            <CheckCheck size={17} aria-hidden="true" />
            Đọc tất cả
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {query.isLoading && (
          <div className="p-4">
            <LoadingSkeleton rows={6} />
          </div>
        )}
        {query.isError && <Alert className="m-4">Không thể tải thông báo.</Alert>}
        {!query.isLoading && notifications.length === 0 && <EmptyState title="Chưa có thông báo" icon={<Bell size={22} />} />}
        <ul className="divide-y divide-slate-100">
          {notifications.map((notification) => {
            const Icon = typeIcon(notification.notificationType);
            return (
              <li key={notification.userNotificationId}>
                <button
                  type="button"
                  onClick={() => openNotification(notification)}
                  className={cn('flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50', !notification.read && 'bg-brand-50/60')}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full',
                      notification.notificationType === 'EVENT_CANCELLED' ? 'bg-accent-50 text-accent-700' : 'bg-brand-100 text-brand-700',
                    )}
                    aria-hidden="true"
                  >
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-slate-600">{typeLabel[notification.notificationType]}</span>
                      <Time value={notification.createdAt} relative className="ml-auto shrink-0 text-xs text-slate-600" />
                    </span>
                    <span className={cn('mt-0.5 block text-sm text-slate-900', !notification.read && 'font-semibold')}>{notification.title}</span>
                    <span className="mt-0.5 line-clamp-2 block text-sm text-slate-600">{notification.content}</span>
                  </span>
                  {!notification.read && (
                    <span className="mt-2 size-2.5 shrink-0 rounded-full bg-accent-600">
                      <span className="sr-only">Chưa đọc</span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <div ref={sentinelRef} aria-hidden="true" />
        {query.isFetchingNextPage && (
          <div className="p-4">
            <LoadingSkeleton rows={2} />
          </div>
        )}
      </Card>
    </div>
  );
};
