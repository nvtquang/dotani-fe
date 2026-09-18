import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Eye, Pencil } from 'lucide-react';
import { ForbiddenMessage } from '../../components/ForbiddenMessage';
import { EmptyState, LoadingSkeleton, PageHeader, StatusBadge } from '../../components/ui';
import { EventForm } from '../../features/events/EventForm';
import { useCreateEvent, useDeleteEvent, useEvents } from '../../hooks/useEvents';
import { useOrganizations } from '../../hooks/useOrganizations';
import { useAuth } from '../../stores/AuthContext';
import type { ApiError } from '../../types/api';
import type { EventFilters, EventFormValues, EventStatus, EventType } from '../../types/event';
import type { OrganizationUnit } from '../../types/organization';
import { eventStatusLabel, eventTypeLabel } from '../../utils/labels';
import { formatDateTime } from '../../utils/dateTime';
import { toApiError } from '../../utils/apiError';

const pageSize = 10;

const canManageEvents = (role: string | null) => role === 'WARD_SECRETARY' || role === 'WARD_DEPUTY_SECRETARY';

const getVisibleOrganizations = (
  organizations: OrganizationUnit[],
  role: string | null,
  tdpId?: string | null,
) => {
  const branches = organizations.filter((organization) => organization.type === 'YOUTH_UNION_BRANCH');

  if (role === 'TDP_SECRETARY' || role === 'TDP_DEPUTY_SECRETARY') {
    return branches.filter((organization) => organization.id === tdpId);
  }

  return branches;
};

export const EventListPage = () => {
  const { role, user } = useAuth();
  const [page, setPage] = useState(0);
  const [type, setType] = useState<EventType | ''>('');
  const [status, setStatus] = useState<EventStatus | ''>('');
  const [organization, setOrganization] = useState('');
  const [date, setDate] = useState('');
  const [upcoming, setUpcoming] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formError, setFormError] = useState<ApiError | null>(null);

  const organizationsQuery = useOrganizations();
  const organizations = useMemo(
    () => getVisibleOrganizations(organizationsQuery.data ?? [], role, user?.tdpId),
    [organizationsQuery.data, role, user?.tdpId],
  );
  const fixedOrganizationId =
    role === 'TDP_SECRETARY' || role === 'TDP_DEPUTY_SECRETARY' ? user?.tdpId : undefined;
  const formFixedOrganizationId = fixedOrganizationId ?? (organization || undefined);
  const canManage = canManageEvents(role);

  const filters: EventFilters = {
    type,
    organization: fixedOrganizationId ?? organization,
    status,
    date,
    upcoming,
    page,
    size: pageSize,
  };
  const eventsQuery = useEvents(filters);
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const events = eventsQuery.data?.content ?? [];
  const totalPages = eventsQuery.data?.totalPages ?? 0;

  const handleCreate = async (values: EventFormValues) => {
    setFormError(null);
    try {
      await createEvent.mutateAsync({
        ...values,
        organizationId: formFixedOrganizationId ?? values.organizationId,
      });
      setIsCreateOpen(false);
    } catch (error) {
      setFormError(toApiError(error));
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm('Xóa sự kiện này?')) {
      return;
    }

    setFormError(null);
    try {
      await deleteEvent.mutateAsync(eventId);
    } catch (error) {
      setFormError(toApiError(error));
    }
  };

  if (eventsQuery.error && toApiError(eventsQuery.error).status === 403) {
    return <ForbiddenMessage />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Hoạt động"
        title="Sự kiện"
        description="Danh sách và sự kiện sắp tới theo phạm vi được phép."
        actions={
          canManage && (
            <button className="primary-button inline-button" type="button" onClick={() => setIsCreateOpen(true)}>
              <CalendarPlus size={17} aria-hidden="true" />
              Tạo sự kiện
            </button>
          )
        }
      />

      <section className="surface toolbar events-toolbar">
        <label>
          Loại
          <select value={type} onChange={(event) => { setType(event.target.value as EventType | ''); setPage(0); }}>
            <option value="">Tất cả</option>
            {(Object.keys(eventTypeLabel) as EventType[]).map((item) => (
              <option key={item} value={item}>
                {eventTypeLabel[item]}
              </option>
            ))}
          </select>
        </label>
        <label>
          TDP
          <select
            disabled={Boolean(fixedOrganizationId)}
            value={fixedOrganizationId ?? organization}
            onChange={(event) => { setOrganization(event.target.value); setPage(0); }}
          >
            <option value="">Tất cả</option>
            {organizations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Trạng thái
          <select value={status} onChange={(event) => { setStatus(event.target.value as EventStatus | ''); setPage(0); }}>
            <option value="">Tất cả</option>
            {(Object.keys(eventStatusLabel) as EventStatus[]).map((item) => (
              <option key={item} value={item}>
                {eventStatusLabel[item]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ngày
          <input type="date" value={date} onChange={(event) => { setDate(event.target.value); setPage(0); }} />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={upcoming} onChange={(event) => { setUpcoming(event.target.checked); setPage(0); }} />
          Sắp tới
        </label>
      </section>

      {formError?.status === 403 && <ForbiddenMessage />}
      {formError && formError.status !== 403 && <section className="error-box">{formError.message}</section>}

      {isCreateOpen && (
        <section className="surface section-gap">
          <div className="section-heading">
            <h2>Tạo sự kiện</h2>
          </div>
          <EventForm
            organizations={organizations}
            fixedOrganizationId={formFixedOrganizationId}
            isSubmitting={createEvent.isPending}
            submitLabel="Tạo sự kiện"
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
          />
        </section>
      )}

      <section className="event-grid section-gap">
        {eventsQuery.isLoading && (
          <div className="surface">
            <LoadingSkeleton rows={4} />
          </div>
        )}
        {!eventsQuery.isLoading && events.length === 0 && (
          <div className="surface">
            <EmptyState title="Không có sự kiện" description="Thử thay đổi bộ lọc hoặc bỏ chọn sắp tới." />
          </div>
        )}
        {events.map((event) => (
          <article className="surface event-card" key={event.id}>
            <div>
              <StatusBadge value={event.status} label={eventStatusLabel[event.status]} />
              <h2>{event.title}</h2>
              <p>{event.location || 'Chưa có địa điểm'}</p>
            </div>
            <dl className="compact-list">
              <div>
                <dt>Loại</dt>
                <dd>{eventTypeLabel[event.type]}</dd>
              </div>
              <div>
                <dt>Bắt đầu</dt>
                <dd>{formatDateTime(event.startTime)}</dd>
              </div>
              <div>
                <dt>Kết thúc</dt>
                <dd>{formatDateTime(event.endTime)}</dd>
              </div>
              <div>
                <dt>Hạn đăng ký</dt>
                <dd>{formatDateTime(event.registrationDeadline)}</dd>
              </div>
            </dl>
            <div className="table-actions">
              <Link className="text-action" to={`/events/${event.id}`}>
                <Eye size={16} aria-hidden="true" />
                Xem
              </Link>
              {canManage && (
                <>
                  <Link className="text-action" to={`/events/${event.id}?mode=edit`}>
                    <Pencil size={16} aria-hidden="true" />
                    Sửa
                  </Link>
                  <button className="danger-link" type="button" onClick={() => handleDelete(event.id)}>
                    Xóa
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </section>

      <div className="pagination">
        <button
          className="secondary-button inline-button"
          type="button"
          disabled={page === 0}
          onClick={() => setPage((current) => Math.max(current - 1, 0))}
        >
          Trước
        </button>
        <span>
          Trang {totalPages === 0 ? 0 : page + 1} / {totalPages}
        </span>
        <button
          className="secondary-button inline-button"
          type="button"
          disabled={totalPages === 0 || page >= totalPages - 1}
          onClick={() => setPage((current) => current + 1)}
        >
          Sau
        </button>
      </div>
    </>
  );
};
