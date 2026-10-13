import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Field, Input, Select, Textarea } from '../../components/ui';
import type { Post, PostFormValues, PostStatus, PostType } from '../../types/post';
import type { OrganizationUnit } from '../../types/organization';
import { applyApiErrors, requiredText } from '../../utils/forms';
import { postStatusLabel, postTypeLabel } from '../../utils/labels';
import { ScopeField } from '../organizations/ScopeField';

const postTypes = Object.keys(postTypeLabel) as PostType[];
const postStatuses = Object.keys(postStatusLabel) as PostStatus[];

const schema = z.object({
  title: requiredText('tiêu đề'),
  type: z.enum(postTypes as [PostType, ...PostType[]]),
  status: z.enum(postStatuses as [PostStatus, ...PostStatus[]]),
  organizationIds: z.array(z.string()).min(1, 'Chọn ít nhất một tổ dân phố'),
  content: z.string().trim().min(1, 'Vui lòng nhập nội dung').max(20000, 'Nội dung tối đa 20.000 ký tự'),
});

type Values = z.infer<typeof schema>;

type PostFormProps = {
  formId: string;
  initialValue?: Post;
  organizations: OrganizationUnit[];
  onSubmit: (values: PostFormValues, organizationIds: string[]) => Promise<void>;
  onError: (message: string) => void;
};

export const PostForm = ({ formId, initialValue, organizations, onSubmit, onError }: PostFormProps) => {
  const isCreate = !initialValue;
  const { register, handleSubmit, control, setValue, setError, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialValue?.title ?? '',
      type: initialValue?.type ?? 'NEWS',
      status: initialValue?.status ?? 'PUBLISHED',
      organizationIds: initialValue ? [initialValue.organizationId] : [],
      content: initialValue?.content ?? '',
    },
  });
  const errors = formState.errors;
  const selected = useWatch({ control, name: 'organizationIds' });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(
        { title: values.title, content: values.content, type: values.type, status: values.status, organizationId: values.organizationIds[0] },
        values.organizationIds,
      );
    } catch (caught) {
      onError(applyApiErrors(caught, setError, 'Không lưu được bài viết'));
    }
  });

  return (
    <form id={formId} onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Tiêu đề" required error={errors.title?.message} className="sm:col-span-2">
        <Input {...register('title')} />
      </Field>
      <Field label="Loại bài" error={errors.type?.message}>
        <Select {...register('type')}>
          {postTypes.map((type) => (
            <option key={type} value={type}>
              {postTypeLabel[type]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Trạng thái" error={errors.status?.message} hint="Bản nháp chỉ cán bộ nhìn thấy">
        <Select {...register('status')}>
          {postStatuses.map((status) => (
            <option key={status} value={status}>
              {postStatusLabel[status]}
            </option>
          ))}
        </Select>
      </Field>
      <ScopeField
        organizations={organizations}
        value={selected}
        onChange={(ids) => setValue('organizationIds', ids, { shouldValidate: formState.isSubmitted })}
        multiple={isCreate}
        error={errors.organizationIds?.message}
        wardHint="Mọi đoàn viên trong phường đều đọc được bài viết."
      />
      <Field label="Nội dung" required error={errors.content?.message} className="sm:col-span-2">
        <Textarea rows={10} {...register('content')} />
      </Field>
    </form>
  );
};

export const PostFormFooter = ({ formId, onCancel, submitLabel, isSubmitting }: { formId: string; onCancel: () => void; submitLabel: string; isSubmitting?: boolean }) => (
  <>
    <Button variant="secondary" onClick={onCancel}>
      Hủy
    </Button>
    <Button type="submit" form={formId} loading={isSubmitting}>
      {submitLabel}
    </Button>
  </>
);
