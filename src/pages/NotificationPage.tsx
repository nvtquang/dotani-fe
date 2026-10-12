import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotifications,
} from '../hooks/useNotifications';
import type { Notification } from '../types/notification';
import { EmptyState, LoadingSkeleton, PageHeader } from '../components/ui';
import { toApiError } from '../utils/apiError';
import { formatDateTime } from '../utils/dateTime';

const pageSize = 10;

const notificationTypeLabel: Record<Notification['notificationType'], string> = {
  EVENT_NEW: 'Sự kiện mới',
  EVENT_UPDATED: 'Sự kiện thay đổi',
  EVENT_CANCELLED: 'Sự kiện bị huỷ',
  EVENT_DEADLINE: 'Sắp hết hạn đăng ký',
  NEW_TASK: 'Công việc mới',
  MEETING_SCHEDULE: 'Lịch họp',
  CONGRESS: 'Đại hội',
  POST_NEW: 'Bài viết mới',
  SYSTEM: 'Hệ thống',
};

const referencePath = (notification: Notification) => {
  if (!notification.referenceId) {
    return null;
  }

  if (notification.referenceType === 'EVENT' || notification.referenceType === 'TASK') {
    return `/events/${notification.referenceId}`;
  }

  if (notification.referenceType === 'POST') {
    return `/posts/${notification.referenceId}`;
  }

  return null;
};

export const NotificationPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const notificationsQuery = useNotifications({ page, size: pageSize });
  const unreadQuery = useUnreadNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const notifications = notificationsQuery.data?.content ?? [];

  const totalPages = notificationsQuery.data?.totalPages ?? 0;
  const canGoPrevious = page > 0;
  const canGoNext = page < totalPages - 1;

  const unreadText = useMemo(() => {
    const count = unreadQuery.data?.count ?? 0;
    return count > 0 ? `${count} chưa đọc` : 'Không có thông báo chưa đọc';
  }, [unreadQuery.data?.count]);

  const handleOpen = async (notification: Notification) => {
    setError(null);

    try {
      if (!notification.read) {
        await markRead.mutateAsync(notification.userNotificationId);
      }

      const path = referencePath(notification);
      if (path) {
        navigate(path);
      }
    } catch (caught) {
      setError(toApiError(caught).message ?? 'Không thể mở thông báo');
    }
  };

  const handleMarkRead = async (notification: Notification) => {
    setError(null);

    try {
      await markRead.mutateAsync(notification.userNotificationId);
    } catch (caught) {
      setError(toApiError(caught).message ?? 'Không thể đánh dấu đã đọc');
    }
  };

  const handleMarkAllRead = async () => {
    setError(null);

    try {
      await markAllRead.mutateAsync();
    } catch (caught) {
      setError(toApiError(caught).message ?? 'Không thể đánh dấu tất cả');
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Cá nhân"
        title="Thông báo"
        description={unreadText}
        actions={
          <button
            className="secondary-button inline-button"
            type="button"
            disabled={(unreadQuery.data?.count ?? 0) === 0 || markAllRead.isPending}
            onClick={handleMarkAllRead}
          >
            Đánh dấu tất cả đã đọc
          </button>
        }
      />

      {error && <div className="error-box">{error}</div>}

      <section className="surface notification-list">
        {notificationsQuery.isLoading && <LoadingSkeleton rows={6} />}

        {notifications.map((notification) => {
          const path = referencePath(notification);

          return (
            <article className={notification.read ? 'notification-item' : 'notification-item unread'} key={notification.userNotificationId}>
              <button className="notification-open" type="button" onClick={() => handleOpen(notification)}>
                <div>
                  <span className="pill">{notificationTypeLabel[notification.notificationType]}</span>
                  <h2>{notification.title}</h2>
                  <p>{notification.content}</p>
                </div>
                <div className="notification-meta">
                  <span>{formatDateTime(notification.createdAt)}</span>
                  {path && <span>{path}</span>}
                </div>
              </button>

              {!notification.read && (
                <button
                  className="text-action"
                  type="button"
                  disabled={markRead.isPending}
                  onClick={() => handleMarkRead(notification)}
                >
                  Đánh dấu đã đọc
                </button>
              )}
            </article>
          );
        })}

        {!notificationsQuery.isLoading && notifications.length === 0 && <EmptyState title="Chưa có thông báo" />}
      </section>

      <div className="pagination">
        <button className="secondary-button inline-button" type="button" disabled={!canGoPrevious} onClick={() => setPage((current) => current - 1)}>
          Trước
        </button>
        <span>
          Trang {totalPages === 0 ? 0 : page + 1}/{totalPages}
        </span>
        <button className="secondary-button inline-button" type="button" disabled={!canGoNext} onClick={() => setPage((current) => current + 1)}>
          Sau
        </button>
      </div>
    </div>
  );
};
