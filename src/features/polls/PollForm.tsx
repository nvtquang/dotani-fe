import { useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { Button, Checkbox, Field, Input, Select, Textarea } from '../../components/ui';
import type { OrganizationUnit } from '../../types/organization';
import type { Poll, PollFormValues, ResultsVisibility } from '../../types/poll';
import { toLocalDateTimeInput } from '../../utils/dateTime';
import { resultsVisibilityLabel } from '../../utils/labels';

type PollFormProps = {
  formId: string;
  initialValue?: Poll;
  /** units the officer manages (ward + TDPs, or only their TDP) */
  organizations: OrganizationUnit[];
  eventId?: string | null;
  onSubmit: (values: PollFormValues) => void;
  onError: (message: string) => void;
};

/** Create or edit a poll. Once open, the options and voting rules are locked (votes were cast on them). */
export const PollForm = ({ formId, initialValue, organizations, eventId, onSubmit, onError }: PollFormProps) => {
  const locked = Boolean(initialValue && initialValue.status !== 'DRAFT');
  const [values, setValues] = useState<PollFormValues>({
    title: initialValue?.title ?? '',
    description: initialValue?.description ?? '',
    organizationId: initialValue?.organizationId ?? organizations[0]?.id ?? '',
    eventId: initialValue?.eventId ?? eventId ?? null,
    anonymous: initialValue?.anonymous ?? false,
    maxChoices: initialValue?.maxChoices ?? 1,
    resultsVisibility: initialValue?.resultsVisibility ?? 'AFTER_VOTE',
    closesAt: toLocalDateTimeInput(initialValue?.closesAt),
    options: initialValue?.options.map((option) => option.label) ?? ['Đồng ý', 'Không đồng ý'],
    open: false,
  });
  const set = <K extends keyof PollFormValues>(key: K, value: PollFormValues[K]) => setValues((current) => ({ ...current, [key]: value }));
  const setOption = (index: number, label: string) => set('options', values.options.map((option, i) => (i === index ? label : option)));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const options = values.options.map((option) => option.trim());
    if (!values.title.trim()) return onError('Nhập tiêu đề.');
    if (options.length < 2 || options.some((option) => !option)) return onError('Cần ít nhất 2 phương án và không để trống phương án nào.');
    if (new Set(options).size !== options.length) return onError('Các phương án không được trùng nhau.');
    if (values.maxChoices < 1 || values.maxChoices > options.length) return onError(`Số lựa chọn tối đa từ 1 đến ${options.length}.`);
    if (values.closesAt && new Date(values.closesAt) <= new Date()) return onError('Thời điểm kết thúc phải ở tương lai.');
    onSubmit({ ...values, title: values.title.trim(), options });
  };

  return (
    <form id={formId} onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Tiêu đề" required className="sm:col-span-2">
        <Input maxLength={255} value={values.title} onChange={(event) => set('title', event.target.value)} placeholder="Biểu quyết thông qua Nghị quyết Đại hội" />
      </Field>
      <Field label="Mô tả" className="sm:col-span-2">
        <Textarea rows={3} maxLength={4000} value={values.description} onChange={(event) => set('description', event.target.value)} />
      </Field>
      <Field label="Người tham gia" hint="Đoàn viên đang hoạt động của đơn vị (phường gồm mọi tổ dân phố)">
        <Select value={values.organizationId} disabled={locked || organizations.length <= 1} onChange={(event) => set('organizationId', event.target.value)}>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.type === 'WARD' ? `Toàn phường (${organization.name})` : organization.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Kết thúc lúc" hint="Để trống: kết thúc khi cán bộ đóng biểu quyết">
        <Input type="datetime-local" value={values.closesAt} onChange={(event) => set('closesAt', event.target.value)} />
      </Field>

      <fieldset className="sm:col-span-2" disabled={locked}>
        <legend className="text-sm font-medium text-slate-800">Phương án</legend>
        {locked && <p className="mt-1 text-xs text-slate-600">Biểu quyết đã mở nên không đổi được phương án.</p>}
        <ol className="mt-2 flex flex-col gap-2">
          {values.options.map((option, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="w-6 text-right text-sm text-slate-600">{index + 1}.</span>
              <Input aria-label={`Phương án ${index + 1}`} maxLength={255} value={option} onChange={(event) => setOption(index, event.target.value)} />
              {values.options.length > 2 && !locked && (
                <Button size="icon" variant="ghost" aria-label={`Bỏ phương án ${index + 1}`} onClick={() => set('options', values.options.filter((_, i) => i !== index))}>
                  <X size={16} aria-hidden="true" />
                </Button>
              )}
            </li>
          ))}
        </ol>
        {values.options.length < 20 && !locked && (
          <Button size="sm" variant="ghost" className="mt-2" onClick={() => set('options', [...values.options, ''])}>
            <Plus size={15} aria-hidden="true" />
            Thêm phương án
          </Button>
        )}
      </fieldset>

      <Field label="Số lựa chọn tối đa mỗi người">
        <Input type="number" min={1} max={values.options.length} disabled={locked} value={values.maxChoices} onChange={(event) => set('maxChoices', Number(event.target.value))} />
      </Field>
      <Field label="Hiển thị kết quả cho đoàn viên">
        <Select value={values.resultsVisibility} onChange={(event) => set('resultsVisibility', event.target.value as ResultsVisibility)}>
          {(Object.keys(resultsVisibilityLabel) as ResultsVisibility[]).map((option) => (
            <option key={option} value={option}>
              {resultsVisibilityLabel[option]}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <Checkbox
          label="Bỏ phiếu kín (không lưu ai chọn phương án nào)"
          checked={values.anonymous}
          disabled={locked}
          onChange={(event) => set('anonymous', event.target.checked)}
        />
        {!initialValue && <Checkbox label="Mở biểu quyết ngay và thông báo cho đoàn viên" checked={values.open} onChange={(event) => set('open', event.target.checked)} />}
      </div>
    </form>
  );
};
