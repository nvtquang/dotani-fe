import { useId, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, Clock, MapPin, Pencil, Trash2 } from 'lucide-react';
import { AttachmentGallery } from '../../components/AttachmentGallery';
import { ForbiddenMessage } from '../../components/ForbiddenMessage';
import { Alert, Badge, Button, Card, Dialog, EmptyState, LoadingSkeleton, Skeleton, StatusBadge, Time, useConfirm, useToast } from '../../components/ui';
import { EventForm, EventFormFooter } from '../../features/events/EventForm';
import { RegistrationPanel } from '../../features/events/RegistrationPanel';
import { MemberProfileDialog } from '../../features/members/MemberProfileDialog';
import {
  useDeleteEvent,
  useDeleteEventAttachment,
  useEvent,
  useMyEventParticipations,
  useParticipants,
  useParticipationSummary,
  useUpdateEvent,
  useUpdateParticipation,
  useUploadEventAttachments,
} from '../../hooks/useEvents';
import { useOrganizations } from '../../hooks/useOrganizations';
import { isTdpRole, isWardRole } from '../../routes/navigation';
import { useAuth } from '../../stores/AuthContext';
import type { EventFormValues, ParticipationStatus } from '../../types/event';
import { toApiError } from '../../utils/apiError';
import { formatDate, formatDateTime, formatTime, isSameDay } from '../../utils/dateTime';
import { eventStatusLabel, eventTypeLabel, participationStatusLabel } from '../../utils/labels';

const timeRange = (start: string, end: string) =>
  isSameDay(new Date(start), new Date(end))
    ? `${formatDate(start)} · ${formatTime(start)} – ${formatTime(end)}`
    : `${formatDateTime(start)} – ${formatDateTime(end)}`;

export const EventDetailPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const formId = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, user } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  const eventQuery = useEvent(id);
  const event = eventQuery.data;
  const canManage = isWardRole(role) || (isTdpRole(role) && Boolean(user?.tdpId) && user?.tdpId === event?.organizationId);
  const isEditing = canManage && searchParams.get('mode') === 'edit';
  const summaryQuery = useParticipationSummary(canManage ? id : '');
  const participantsQuery = useParticipants(id, canManage);
  const myParticipations = useMyEventParticipations(Boolean(user?.memberId));
  const organizationsQuery = useOrganizations(canManage);
  const updateEvent = useUpdateEvent(id);
  const deleteEvent = useDeleteEvent();
  const uploadAttachments = useUploadEventAttachments(id);
  const deleteAttachment = useDeleteEventAttachment(id);
  const updateParticipation = useUpdateParticipation(id);
  const myStatus = myParticipations.data?.find((item) => item.eventId === id)?.status;

  const showError = (caught: unknown, fallback: string) => toast.error(toApiError(caught).message ?? fallback);

  const handleUpdate = async (values: EventFormValues) => {
    await updateEvent.mutateAsync(values);
    toast.success('Đã lưu sự kiện');
    setSearchParams({}, { replace: true });
  };

  const handleDelete = async () => {
    if (!(await confirm({ title: 'Xóa sự kiện này?', description: 'Đoàn viên sẽ không còn thấy sự kiện và các đăng ký liên quan.', confirmLabel: 'Xóa', tone: 'danger' }))) {
      return;
    }
    try {
      await deleteEvent.mutateAsync(id);
      toast.success('Đã xóa sự kiện');
      navigate('/events');
    } catch (caught) {
      showError(caught, 'Không xóa được sự kiện');
    }
  };

  const handleParticipation = async (status: ParticipationStatus) => {
    try {
      await updateParticipation.mutateAsync(status);
      const previous = myStatus;
      toast.success(
        status === 'GOING' ? 'Đã đăng ký tham gia' : previous === 'GOING' && status === 'NOT_GOING' ? 'Đã hủy đăng ký' : `Đã cập nhật: ${participationStatusLabel[status]}`,
      );
    } catch (caught) {
      showError(caught, 'Không cập nhật được đăng ký');
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!(await confirm({ title: 'Xóa tệp đính kèm này?', confirmLabel: 'Xóa', tone: 'danger' }))) {
      return;
    }
    deleteAttachment.mutate(attachmentId, { onError: (caught) => showError(caught, 'Không xóa được tệp') });
  };

  if (eventQuery.error && toApiError(eventQuery.error).status === 403) {
    return <ForbiddenMessage />;
  }
  if (eventQuery.isLoading) {
    return (
      <Card className="p-5">
        <Skeleton className="mb-4 h-7 w-2/3" />
        <LoadingSkeleton rows={5} />
      </Card>
    );
  }
  if (!event) {
    return <Alert>Không tìm thấy sự kiện.</Alert>;
  }

  const summary = summaryQuery.data;
  const participants = participantsQuery.data ?? [];

  return (
    <>
      <Link to="/events" className="mb-3 inline-flex h-10 items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900">
        <ArrowLeft size={17} aria-hidden="true" />
        Sự kiện
      </Link>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone="gray">{eventTypeLabel[event.type]}</Badge>
              {(canManage || event.status === 'CANCELLED') && event.status !== 'PUBLISHED' && (
                <StatusBadge value={event.status} label={eventStatusLabel[event.status]} />
              )}
            </div>
            <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{event.title}</h1>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li className="flex gap-2">
                <Clock size={18} className="mt-0.5 shrink-0 text-slate-600" aria-hidden="true" />
                {timeRange(event.startTime, event.endTime)}
              </li>
              {event.location && (
                <li className="flex gap-2">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-slate-600" aria-hidden="true" />
                  {event.location}
                </li>
              )}
              <li className="flex gap-2">
                <Building2 size={18} className="mt-0.5 shrink-0 text-slate-600" aria-hidden="true" />
                {event.organizationName ?? 'Đoàn phường'}
              </li>
            </ul>
            {event.description && <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line text-slate-800">{event.description}</p>}

            {canManage && (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                <Button variant="secondary" onClick={() => setSearchParams({ mode: 'edit' })}>
                  <Pencil size={16} aria-hidden="true" />
                  Sửa
                </Button>
                <Button variant="danger" onClick={handleDelete} loading={deleteEvent.isPending}>
                  <Trash2 size={16} aria-hidden="true" />
                  Xóa
                </Button>
              </div>
            )}
          </Card>

          <AttachmentGallery
            title="Tệp đính kèm"
            items={(event.attachments ?? []).map((item) => ({ id: item.id, url: item.fileUrl, kind: item.attachmentKind, name: item.fileName }))}
            manage={
              canManage
                ? {
                    accept: 'image/jpeg,image/png,image/webp,.pdf,.txt,.doc,.docx,.xls,.xlsx',
                    uploading: uploadAttachments.isPending,
                    onUpload: (files) => uploadAttachments.mutate(files, { onError: (caught) => showError(caught, 'Không tải lên được tệp') }),
                    onDelete: handleDeleteAttachment,
                  }
                : undefined
            }
          />

          {canManage && (
            <Card className="p-4 sm:p-5">
              <h2 className="text-base font-semibold text-slate-900">Phản hồi của đoàn viên</h2>
              {summary && (
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Tham gia', value: summary.going, tone: 'text-emerald-800' },
                    { label: 'Chưa chắc', value: summary.undecided, tone: 'text-amber-800' },
                    { label: 'Không', value: summary.notGoing, tone: 'text-accent-700' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-slate-50 py-2">
                      <dt className="text-xs text-slate-600">{item.label}</dt>
                      <dd className={`text-xl font-bold ${item.tone}`}>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {participantsQuery.isLoading && <LoadingSkeleton rows={3} />}
              {!participantsQuery.isLoading && participants.length === 0 && <EmptyState title="Chưa có phản hồi" />}
              <ul className="mt-3 divide-y divide-slate-100">
                {participants.map((participant) => (
                  <li key={participant.id} className="flex items-center gap-3 py-2">
                    <button type="button" className="min-w-0 flex-1 truncate text-left text-sm font-medium text-brand-700 hover:underline" onClick={() => setProfileId(participant.memberId)}>
                      {participant.participantName ?? 'Đoàn viên'}
                    </button>
                    <Time value={participant.updatedAt} relative className="hidden text-xs text-slate-600 sm:inline" />
                    <StatusBadge value={participant.status} label={participationStatusLabel[participant.status]} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <aside className="lg:sticky lg:top-20">
          {user?.memberId && (
            <RegistrationPanel event={event} myStatus={myStatus} pending={updateParticipation.isPending} onChange={handleParticipation} />
          )}
        </aside>
      </div>

      {canManage && (
        <Dialog
          open={isEditing}
          onClose={() => setSearchParams({}, { replace: true })}
          title="Sửa sự kiện"
          size="lg"
          footer={<EventFormFooter formId={formId} onCancel={() => setSearchParams({}, { replace: true })} submitLabel="Lưu" isSubmitting={updateEvent.isPending} />}
        >
          {formError && <Alert className="mb-4">{formError}</Alert>}
          {organizationsQuery.isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <EventForm
              formId={formId}
              initialValue={event}
              organizations={organizationsQuery.data ?? []}
              fixedOrganizationId={isTdpRole(role) ? user?.tdpId : undefined}
              onSubmit={handleUpdate}
              onError={setFormError}
            />
          )}
        </Dialog>
      )}

      <MemberProfileDialog memberId={profileId} onClose={() => setProfileId(null)} />
    </>
  );
};
