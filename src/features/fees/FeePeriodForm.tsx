import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Field, Input, Select, Textarea } from '../../components/ui';
import type { FeePeriod, FeePeriodFormValues } from '../../types/fee';
import type { OrganizationUnit } from '../../types/organization';
import { applyApiErrors, optionalText, requiredText } from '../../utils/forms';
import { feePeriodStatusLabel } from '../../utils/labels';

const schema = z.object({
  name: requiredText('tên kỳ đoàn phí'),
  description: optionalText(2000),
  organizationId: z.string().min(1, 'Chọn đơn vị'),
  amount: z.number({ error: 'Nhập số tiền' }).int('Số tiền là số nguyên').min(1000, 'Tối thiểu 1.000 đ').max(100_000_000, 'Số tiền quá lớn'),
  dueDate: z.string(),
  collectorMemberId: z.string(),
  status: z.enum(['OPEN', 'CLOSED']),
});

type FeePeriodFormProps = {
  formId: string;
  initialValue?: FeePeriod;
  /** units the officer can create periods for (ward + TDPs, or only their TDP) */
  organizations: OrganizationUnit[];
  me: { memberId?: string | null; name?: string | null };
  onSubmit: (values: FeePeriodFormValues) => Promise<void>;
  onError: (message: string) => void;
};

export const FeePeriodForm = ({ formId, initialValue, organizations, me, onSubmit, onError }: FeePeriodFormProps) => {
  const { register, handleSubmit, setError, formState } = useForm<FeePeriodFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialValue?.name ?? `Đoàn phí năm ${new Date().getFullYear()}`,
      description: initialValue?.description ?? '',
      organizationId: initialValue?.organizationId ?? organizations[0]?.id ?? '',
      amount: initialValue?.amount ?? 24000,
      dueDate: initialValue?.dueDate ?? '',
      collectorMemberId: initialValue ? (initialValue.collector?.memberId ?? '') : (me.memberId ?? ''),
      status: initialValue?.status ?? 'OPEN',
    },
  });
  const errors = formState.errors;
  const currentCollector = initialValue?.collector;

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (caught) {
      onError(applyApiErrors(caught, setError, 'Không lưu được kỳ đoàn phí'));
    }
  });

  return (
    <form id={formId} onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Tên kỳ" required error={errors.name?.message} className="sm:col-span-2">
        <Input {...register('name')} placeholder="Đoàn phí quý IV/2026" />
      </Field>
      <Field label="Đơn vị thu" required error={errors.organizationId?.message} hint="Kỳ của phường áp dụng cho mọi đoàn viên trong phường">
        <Select {...register('organizationId')} disabled={organizations.length <= 1}>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.type === 'WARD' ? `Toàn phường (${organization.name})` : organization.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Số tiền mỗi đoàn viên (đ)" required error={errors.amount?.message}>
        <Input type="number" inputMode="numeric" min={1000} step={1000} {...register('amount', { valueAsNumber: true })} />
      </Field>
      <Field label="Hạn nộp" error={errors.dueDate?.message}>
        <Input type="date" {...register('dueDate')} />
      </Field>
      <Field label="Người thu" error={errors.collectorMemberId?.message} hint="Đoàn viên chuyển khoản theo QR Banking trong hồ sơ người thu">
        <Select {...register('collectorMemberId')}>
          <option value="">Không chỉ định</option>
          {me.memberId && <option value={me.memberId}>Tôi{me.name ? ` – ${me.name}` : ''}</option>}
          {currentCollector && currentCollector.memberId !== me.memberId && <option value={currentCollector.memberId}>{currentCollector.fullName}</option>}
        </Select>
      </Field>
      {initialValue && (
        <Field label="Trạng thái" error={errors.status?.message} hint="Kỳ đã đóng không ghi nhận thêm khoản đóng">
          <Select {...register('status')}>
            {(Object.keys(feePeriodStatusLabel) as Array<keyof typeof feePeriodStatusLabel>).map((status) => (
              <option key={status} value={status}>
                {feePeriodStatusLabel[status]}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Ghi chú" error={errors.description?.message} className="sm:col-span-2">
        <Textarea rows={3} {...register('description')} placeholder="Nội dung chuyển khoản: Họ tên - TDP - Đoàn phí" />
      </Field>
    </form>
  );
};
