import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Field, Input, Select, Textarea } from '../../components/ui';
import { ScopeField } from '../organizations/ScopeField';
import type { Event, EventFormValues, EventStatus, EventType } from '../../types/event';
import type { OrganizationUnit } from '../../types/organization';
import { applyApiErrors, optionalText, requiredText } from '../../utils/forms';
import { toLocalDateTimeInput } from '../../utils/dateTime';
import { eventStatusLabel, eventTypeLabel } from '../../utils/labels';

const eventTypes = Object.keys(eventTypeLabel) as EventType[];
const eventStatuses = Object.keys(eventStatusLabel) as EventStatus[];

const schema = z
  .object({
    title: requiredText('tiêu đề'),
    type: z.enum(eventTypes as [EventType, ...EventType[]]),
    startTime: z.string().min(1, 'Chọn thời gian bắt đầu'),
    endTime: z.string().min(1, 'Chọn thời gian kết thúc'),
    registrationDeadline: z.string(),
    location: optionalText(),
    organizationIds: z.array(z.string()).min(1, 'Chọn ít nhất một tổ dân phố'),
    maxParticipants: z
      .string()
      .trim()
      .regex(/^\d*$/, 'Nhập số nguyên')
      .refine((value) => !value || Number(value) >= 1, 'Tối thiểu 1 người'),
    status: z.enum(eventStatuses as [EventStatus, ...EventStatus[]]),
    description: optionalText(5000),
  })
  .superRefine((values, context) => {
    if (values.startTime && values.endTime && values.endTime <= values.startTime) {
      context.addIssue({ code: 'custom', path: ['endTime'], message: 'Kết thúc phải sau thời gian bắt đầu' });
    }
    if (values.registrationDeadline && values.startTime && values.registrationDeadline > values.startTime) {
      context.addIssue({ code: 'custom', path: ['registrationDeadline'], message: 'Hạn đăng ký phải trước khi sự kiện bắt đầu' });
    }
  });

type Values = z.infer<typeof schema>;

type EventFormProps = {
  formId: string;
  initialValue?: Event;
  /** all units the user can see (ward + TDPs) */
  organizations: OrganizationUnit[];
  /** TDP officers: always their own TDP */
  fixedOrganizationId?: string | null;
  /** one call per selected unit; throw to show the API error on the form */
  onSubmit: (values: EventFormValues, organizationIds: string[]) => Promise<void>;
  onError: (message: string) => void;
};

/** Event fields only; the dialog that hosts it renders the submit button with form={formId}. */
export const EventForm = ({ formId, initialValue, organizations, fixedOrganizationId, onSubmit, onError }: EventFormProps) => {
  const isCreate = !initialValue;
  const initialOrganizationId = fixedOrganizationId ?? initialValue?.organizationId;

  const { register, handleSubmit, control, setValue, setError, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialValue?.title ?? '',
      type: initialValue?.type ?? 'EVENT',
      startTime: toLocalDateTimeInput(initialValue?.startTime),
      endTime: toLocalDateTimeInput(initialValue?.endTime),
      registrationDeadline: toLocalDateTimeInput(initialValue?.registrationDeadline),
      location: initialValue?.location ?? '',
      organizationIds: initialOrganizationId ? [initialOrganizationId] : [],
      maxParticipants: initialValue?.maxParticipants?.toString() ?? '',
      status: initialValue?.status ?? 'PUBLISHED',
      description: initialValue?.description ?? '',
    },
  });
  const errors = formState.errors;
  const selected = useWatch({ control, name: 'organizationIds' });

  const submit = handleSubmit(async (values) => {
    const payload: EventFormValues = {
      title: values.title,
      description: values.description,
      type: values.type,
      location: values.location,
      startTime: values.startTime,
      endTime: values.endTime,
      registrationDeadline: values.registrationDeadline || undefined,
      organizationId: values.organizationIds[0],
      maxParticipants: values.maxParticipants,
      status: values.status,
    };
    try {
      await onSubmit(payload, values.organizationIds);
    } catch (caught) {
      onError(applyApiErrors(caught, setError, 'Không lưu được sự kiện'));
    }
  });

  return (
    <form id={formId} onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Tiêu đề" required error={errors.title?.message} className="sm:col-span-2">
        <Input {...register('title')} />
      </Field>
      <Field label="Loại" error={errors.type?.message}>
        <Select {...register('type')}>
          {eventTypes.map((type) => (
            <option key={type} value={type}>
              {eventTypeLabel[type]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Trạng thái" error={errors.status?.message} hint="Bản nháp chỉ cán bộ nhìn thấy">
        <Select {...register('status')}>
          {eventStatuses.map((status) => (
            <option key={status} value={status}>
              {eventStatusLabel[status]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Bắt đầu" required error={errors.startTime?.message}>
        <Input type="datetime-local" {...register('startTime')} />
      </Field>
      <Field label="Kết thúc" required error={errors.endTime?.message}>
        <Input type="datetime-local" {...register('endTime')} />
      </Field>
      <Field label="Hạn đăng ký" error={errors.registrationDeadline?.message} hint="Bỏ trống: đăng ký đến khi bắt đầu">
        <Input type="datetime-local" {...register('registrationDeadline')} />
      </Field>
      <Field label="Số lượng tối đa" error={errors.maxParticipants?.message} hint="Bỏ trống: không giới hạn">
        <Input inputMode="numeric" {...register('maxParticipants')} />
      </Field>
      <Field label="Địa điểm" error={errors.location?.message} className="sm:col-span-2">
        <Input {...register('location')} />
      </Field>

      {fixedOrganizationId ? (
        <p className="text-sm text-slate-700 sm:col-span-2">
          Đơn vị: <strong>{organizations.find((organization) => organization.id === fixedOrganizationId)?.name ?? 'TDP của bạn'}</strong>
        </p>
      ) : (
        <ScopeField
          organizations={organizations}
          value={selected}
          onChange={(ids) => setValue('organizationIds', ids, { shouldValidate: formState.isSubmitted })}
          multiple={isCreate}
          error={errors.organizationIds?.message}
          wardHint="Mọi đoàn viên trong phường nhìn thấy và nhận thông báo."
        />
      )}

      <Field label="Mô tả" error={errors.description?.message} className="sm:col-span-2">
        <Textarea rows={5} {...register('description')} />
      </Field>
    </form>
  );
};

export const EventFormFooter = ({ formId, onCancel, submitLabel, isSubmitting }: { formId: string; onCancel: () => void; submitLabel: string; isSubmitting?: boolean }) => (
  <>
    <Button variant="secondary" onClick={onCancel}>
      Hủy
    </Button>
    <Button type="submit" form={formId} loading={isSubmitting}>
      {submitLabel}
    </Button>
  </>
);
