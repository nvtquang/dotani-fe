import { useId, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, CalendarPlus, List } from 'lucide-react';
import { ForbiddenMessage } from '../../components/ForbiddenMessage';
import { Alert, Button, Card, Dialog, EmptyState, PageHeader, Select, Skeleton, Tabs, cn, useToast, type TabItem } from '../../components/ui';
import { EventCalendar, calendarRange, startOfMonth } from '../../features/events/EventCalendar';
import { EventCard } from '../../features/events/EventCard';
import { EventForm, EventFormFooter } from '../../features/events/EventForm';
import { useCreateEvent, useEvents, useInfiniteEvents, useMyEventParticipations } from '../../hooks/useEvents';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useOrganizations } from '../../hooks/useOrganizations';
import { isManager, isTdpRole, isWardRole } from '../../routes/navigation';
import { useAuth } from '../../stores/AuthContext';
import type { EventFilters, EventFormValues, EventStatus, EventType } from '../../types/event';
import { toApiError } from '../../utils/apiError';
import { formatDate, isSameDay } from '../../utils/dateTime';
import { eventStatusLabel, eventTypeLabel } from '../../utils/labels';

type EventTab = 'upcoming' | 'past' | 'mine';

const tabs: TabItem<EventTab>[] = [
  { value: 'upcoming', label: 'Sắp diễn ra' },
  { value: 'past', label: 'Đã qua' },
  { value: 'mine', label: 'Tôi tham gia' },
];

const tabFilters: Record<EventTab, Pick<EventFilters, 'when' | 'participating' | 'sort'>> = {
  upcoming: { when: 'UPCOMING', sort: 'startTime,asc' },
  past: { when: 'PAST', sort: 'startTime,desc' },
  mine: { participating: true, sort: 'startTime,desc' },
};

const CardSkeleton = () => (
  <Card className="flex gap-3 p-4">
    <Skeleton className="h-18 w-14 rounded-xl" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </Card>
);

export const EventListPage = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const formId = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (tabs.find((item) => item.value === searchParams.get('tab'))?.value ?? 'upcoming') as EventTab;
  const view = searchParams.get('view') === 'calendar' ? 'calendar' : 'list';
  const isCreateOpen = searchParams.get('create') === '1';

  const manager = isManager(role);
  const [type, setType] = useState<EventType | ''>('');
  const [status, setStatus] = useState<EventStatus | ''>('');
  const [organization, setOrganization] = useState('');
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [formError, setFormError] = useState<string | null>(null);

  const organizationsQuery = useOrganizations(manager);
  const organizations = organizationsQuery.data ?? [];
  const branches = organizations.filter((item) => item.type === 'YOUTH_UNION_BRANCH');
  const fixedOrganizationId = isTdpRole(role) ? user?.tdpId : undefined;

  const updateParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => (value === null ? next.delete(key) : next.set(key, value)));
    setSearchParams(next, { replace: true });
  };

  const baseFilters = { type, status, organization: organization || undefined, size: 10 };

  const listQuery = useInfiniteEvents({ ...baseFilters, ...tabFilters[tab] }, view === 'list');
  const { start, end } = calendarRange(month);
  const calendarQuery = useEvents(
    { ...baseFilters, from: start.toISOString(), to: end.toISOString(), page: 0, size: 300, sort: 'startTime,asc' },
    view === 'calendar',
  );
  const participations = useMyEventParticipations(Boolean(user?.memberId));
  const myStatusByEvent = useMemo(
    () => new Map((participations.data ?? []).map((participation) => [participation.eventId, participation.status])),
    [participations.data],
  );
  const createEvent = useCreateEvent();

  const events = listQuery.data?.pages.flatMap((page) => page.content) ?? [];
  const calendarEvents = calendarQuery.data?.content ?? [];
  const dayEvents = calendarEvents.filter((event) => isSameDay(new Date(event.startTime), selectedDay));

  const sentinelRef = useInfiniteScroll(() => {
    if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) {
      void listQuery.fetchNextPage();
    }
  }, Boolean(listQuery.hasNextPage) && view === 'list');

  const closeCreate = () => {
    setFormError(null);
    updateParams({ create: null });
  };

  const handleCreate = async (values: EventFormValues, organizationIds: string[]) => {
    setFormError(null);
    let created = null;
    for (const organizationId of organizationIds) {
      created = await createEvent.mutateAsync({ ...values, organizationId });
    }
    toast.success(organizationIds.length > 1 ? `Đã tạo ${organizationIds.length} sự kiện` : 'Đã tạo sự kiện');
    closeCreate();
    if (created && organizationIds.length === 1) {
      navigate(`/events/${created.id}`);
    }
  };

  const error = view === 'list' ? listQuery.error : calendarQuery.error;
  if (error && toApiError(error).status === 403) {
    return <ForbiddenMessage />;
  }

  return (
    <>
      <PageHeader
        title="Sự kiện"
        actions={
          <>
            <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5" role="group" aria-label="Kiểu hiển thị">
              {(['list', 'calendar'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={view === value}
                  onClick={() => updateParams({ view: value === 'list' ? null : value })}
                  className={cn(
                    'inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium',
                    view === value ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100',
                  )}
                >
                  {value === 'list' ? <List size={16} aria-hidden="true" /> : <CalendarDays size={16} aria-hidden="true" />}
                  {value === 'list' ? 'Danh sách' : 'Lịch'}
                </button>
              ))}
            </div>
            {manager && (
              <Button onClick={() => updateParams({ create: '1' })}>
                <CalendarPlus size={17} aria-hidden="true" />
                Tạo sự kiện
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Select aria-label="Loại sự kiện" className="sm:w-auto! sm:min-w-36" value={type} onChange={(event) => setType(event.target.value as EventType | '')}>
          <option value="">Mọi loại</option>
          {(Object.keys(eventTypeLabel) as EventType[]).map((item) => (
            <option key={item} value={item}>
              {eventTypeLabel[item]}
            </option>
          ))}
        </Select>
        {isWardRole(role) && (
          <Select aria-label="Tổ dân phố" className="sm:w-auto! sm:min-w-40" value={organization} onChange={(event) => setOrganization(event.target.value)}>
            <option value="">Mọi đơn vị</option>
            {organizations
              .filter((item) => item.type === 'WARD')
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (toàn phường)
                </option>
              ))}
            {branches.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        )}
        {manager && (
          <Select aria-label="Trạng thái" className="sm:w-auto! sm:min-w-36" value={status} onChange={(event) => setStatus(event.target.value as EventStatus | '')}>
            <option value="">Mọi trạng thái</option>
            {(Object.keys(eventStatusLabel) as EventStatus[]).map((item) => (
              <option key={item} value={item}>
                {eventStatusLabel[item]}
              </option>
            ))}
          </Select>
        )}
      </div>

      {view === 'list' ? (
        <div className="mx-auto max-w-3xl">
          <Tabs label="Lọc sự kiện" idPrefix="event-tab" items={tabs} value={tab} onChange={(value) => updateParams({ tab: value === 'upcoming' ? null : value })} />
          <section role="tabpanel" aria-labelledby={`event-tab-${tab}`} aria-busy={listQuery.isLoading} className="mt-4 flex flex-col gap-3">
            {listQuery.isLoading && Array.from({ length: 3 }).map((_, index) => <CardSkeleton key={index} />)}
            {listQuery.isError && <Alert>Không thể tải danh sách sự kiện.</Alert>}
            {!listQuery.isLoading && !listQuery.isError && events.length === 0 && (
              <Card>
                <EmptyState
                  title={tab === 'mine' ? 'Bạn chưa đăng ký sự kiện nào' : tab === 'past' ? 'Chưa có sự kiện đã qua' : 'Chưa có sự kiện sắp diễn ra'}
                  description={tab === 'mine' ? 'Mở một sự kiện sắp diễn ra và bấm “Đăng ký tham gia”.' : undefined}
                />
              </Card>
            )}
            {events.map((event) => (
              <EventCard key={event.id} event={event} showStatus={manager} myStatus={myStatusByEvent.get(event.id)} />
            ))}
            <div ref={sentinelRef} aria-hidden="true" />
            {listQuery.isFetchingNextPage && <CardSkeleton />}
            {listQuery.hasNextPage && !listQuery.isFetchingNextPage && (
              <Button variant="secondary" className="self-center" onClick={() => void listQuery.fetchNextPage()}>
                Xem thêm
              </Button>
            )}
          </section>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <EventCalendar
            month={month}
            onMonthChange={setMonth}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            events={calendarEvents}
            isLoading={calendarQuery.isFetching}
          />
          <section aria-live="polite" className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-slate-900">{formatDate(selectedDay)}</h2>
            {calendarQuery.isError && <Alert>Không thể tải lịch sự kiện.</Alert>}
            {dayEvents.length === 0 && !calendarQuery.isLoading && <p className="text-sm text-slate-600">Không có sự kiện trong ngày này.</p>}
            {dayEvents.map((event) => (
              <EventCard key={event.id} event={event} showStatus={manager} myStatus={myStatusByEvent.get(event.id)} />
            ))}
          </section>
        </div>
      )}

      {manager && (
        <Dialog
          open={isCreateOpen}
          onClose={closeCreate}
          title="Tạo sự kiện"
          size="lg"
          footer={<EventFormFooter formId={formId} onCancel={closeCreate} submitLabel="Tạo sự kiện" isSubmitting={createEvent.isPending} />}
        >
          {formError && <Alert className="mb-4">{formError}</Alert>}
          {organizationsQuery.isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <EventForm formId={formId} organizations={organizations} fixedOrganizationId={fixedOrganizationId} onSubmit={handleCreate} onError={setFormError} />
          )}
        </Dialog>
      )}
    </>
  );
};
