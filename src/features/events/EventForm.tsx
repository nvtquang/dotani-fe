import { FormEvent, useEffect, useState } from 'react';
import type { Event, EventFormValues, EventStatus, EventType } from '../../types/event';
import type { OrganizationUnit } from '../../types/organization';
import { eventStatusLabel, eventTypeLabel } from '../../utils/labels';
import { toDateInputValue } from '../../utils/dateTime';

type EventFormProps = {
  initialValue?: Event;
  organizations: OrganizationUnit[];
  fixedOrganizationId?: string | null;
  isSubmitting?: boolean;
  submitLabel: string;
  onSubmit: (values: EventFormValues) => void;
  onCancel?: () => void;
};

const eventTypes: EventType[] = ['EVENT', 'MEETING', 'CONGRESS', 'TASK', 'ACTIVITY'];
const eventStatuses: EventStatus[] = ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'];

const toFormValues = (
  event: Event | undefined,
  defaultOrganizationId: string,
  fixedOrganizationId?: string | null,
): EventFormValues => ({
  title: event?.title ?? '',
  description: event?.description ?? '',
  type: event?.type ?? 'EVENT',
  location: event?.location ?? '',
  startTime: toDateInputValue(event?.startTime),
  endTime: toDateInputValue(event?.endTime),
  registrationDeadline: toDateInputValue(event?.registrationDeadline),
  organizationId: fixedOrganizationId ?? event?.organizationId ?? defaultOrganizationId,
  maxParticipants: event?.maxParticipants?.toString() ?? '',
  status: event?.status ?? 'PUBLISHED',
});

export const EventForm = ({
  initialValue,
  organizations,
  fixedOrganizationId,
  isSubmitting,
  submitLabel,
  onSubmit,
  onCancel,
}: EventFormProps) => {
  const defaultOrganizationId = organizations[0]?.id ?? fixedOrganizationId ?? '';
  const [values, setValues] = useState<EventFormValues>(() =>
    toFormValues(initialValue, defaultOrganizationId, fixedOrganizationId),
  );

  useEffect(() => {
    setValues(toFormValues(initialValue, defaultOrganizationId, fixedOrganizationId));
  }, [defaultOrganizationId, fixedOrganizationId, initialValue]);

  const updateField = (field: keyof EventFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form className="member-form" onSubmit={handleSubmit}>
      <label>
        Tiêu đề
        <input
          required
          maxLength={255}
          value={values.title}
          onChange={(event) => updateField('title', event.target.value)}
        />
      </label>
      <label>
        Loại
        <select value={values.type} onChange={(event) => updateField('type', event.target.value)}>
          {eventTypes.map((type) => (
            <option key={type} value={type}>
              {eventTypeLabel[type]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Bắt đầu
        <input
          required
          type="date"
          value={values.startTime}
          onChange={(event) => updateField('startTime', event.target.value)}
        />
      </label>
      <label>
        Kết thúc
        <input
          required
          type="date"
          value={values.endTime}
          onChange={(event) => updateField('endTime', event.target.value)}
        />
      </label>
      <label>
        Hạn đăng ký
        <input
          type="date"
          value={values.registrationDeadline ?? ''}
          onChange={(event) => updateField('registrationDeadline', event.target.value)}
        />
      </label>
      <label>
        Địa điểm
        <input
          maxLength={255}
          value={values.location ?? ''}
          onChange={(event) => updateField('location', event.target.value)}
        />
      </label>
      <label>
        Tổ dân phố
        <select
          required
          disabled={Boolean(fixedOrganizationId)}
          value={values.organizationId}
          onChange={(event) => updateField('organizationId', event.target.value)}
        >
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Số lượng tối đa
        <input
          min={1}
          type="number"
          value={values.maxParticipants ?? ''}
          onChange={(event) => updateField('maxParticipants', event.target.value)}
        />
      </label>
      <label>
        Trạng thái
        <select value={values.status} onChange={(event) => updateField('status', event.target.value)}>
          {eventStatuses.map((status) => (
            <option key={status} value={status}>
              {eventStatusLabel[status]}
            </option>
          ))}
        </select>
      </label>
      <label className="form-wide">
        Mô tả
        <textarea value={values.description ?? ''} onChange={(event) => updateField('description', event.target.value)} />
      </label>
      <div className="form-actions form-wide">
        {onCancel && (
          <button className="secondary-button inline-button" type="button" onClick={onCancel}>
            Hủy
          </button>
        )}
        <button className="primary-button inline-button" type="submit" disabled={isSubmitting}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
};
