import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import { ForbiddenMessage } from '../../components/ForbiddenMessage';
import { Alert, Button, Card, Checkbox, Dialog, EmptyState, Field, Input, LoadingSkeleton, PageHeader, Select, StatusBadge, useConfirm, useToast } from '../../components/ui';
import { useCreateOrganization, useDeleteOrganization, useOrganizationMembers, useOrganizations, useUpdateOrganization } from '../../hooks/useOrganizations';
import type { OrganizationUnit, OrganizationUnitFormValues, OrganizationUnitType } from '../../types/organization';
import { toApiError } from '../../utils/apiError';
import { applyApiErrors, requiredText } from '../../utils/forms';

const typeLabel: Record<OrganizationUnitType, string> = {
  WARD: 'Phường',
  YOUTH_UNION_BRANCH: 'Chi đoàn TDP',
};

const schema = z
  .object({
    name: requiredText('tên đơn vị'),
    code: requiredText('mã đơn vị', 100),
    type: z.enum(['WARD', 'YOUTH_UNION_BRANCH']),
    parentId: z.string(),
    active: z.boolean(),
  })
  .refine((values) => values.type === 'WARD' || values.parentId, { path: ['parentId'], message: 'Chọn đơn vị cha' });

type Values = z.infer<typeof schema>;

const OrganizationForm = ({
  formId,
  initial,
  wards,
  onSubmit,
  onError,
}: {
  formId: string;
  initial: OrganizationUnit | null;
  wards: OrganizationUnit[];
  onSubmit: (values: OrganizationUnitFormValues) => Promise<void>;
  onError: (message: string) => void;
}) => {
  const { register, handleSubmit, control, setError, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      code: initial?.code ?? '',
      type: initial?.type ?? 'YOUTH_UNION_BRANCH',
      parentId: initial?.parentId ?? wards[0]?.id ?? '',
      active: initial?.active ?? true,
    },
  });
  const type = useWatch({ control, name: 'type' });
  const errors = formState.errors;

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({ ...values, parentId: values.type === 'WARD' ? '' : values.parentId });
    } catch (caught) {
      onError(applyApiErrors(caught, setError, 'Không lưu được đơn vị'));
    }
  });

  return (
    <form id={formId} className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
      <Field label="Tên đơn vị" required error={errors.name?.message} className="sm:col-span-2">
        <Input {...register('name')} />
      </Field>
      <Field label="Mã đơn vị" required error={errors.code?.message}>
        <Input {...register('code')} />
      </Field>
      <Field label="Loại" error={errors.type?.message}>
        <Select {...register('type')}>
          <option value="YOUTH_UNION_BRANCH">{typeLabel.YOUTH_UNION_BRANCH}</option>
          <option value="WARD">{typeLabel.WARD}</option>
        </Select>
      </Field>
      {type === 'YOUTH_UNION_BRANCH' && (
        <Field label="Đơn vị cha" required error={errors.parentId?.message}>
          <Select {...register('parentId')}>
            {wards.map((ward) => (
              <option key={ward.id} value={ward.id}>
                {ward.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Checkbox label="Đang hoạt động" className="sm:col-span-2" {...register('active')} />
    </form>
  );
};

export const OrganizationPage = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const formId = useId();
  const organizationsQuery = useOrganizations();
  const organizations = organizationsQuery.data ?? [];
  const wards = organizations.filter((item) => item.type === 'WARD');
  const [editing, setEditing] = useState<OrganizationUnit | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<OrganizationUnit | null>(null);
  const createOrganization = useCreateOrganization();
  const updateOrganization = useUpdateOrganization(editing?.id ?? '');
  const deleteOrganization = useDeleteOrganization();
  const membersQuery = useOrganizationMembers(viewing?.id ?? '');

  const openForm = (organization: OrganizationUnit | null) => {
    setEditing(organization);
    setFormError(null);
    setIsFormOpen(true);
  };

  const save = async (values: OrganizationUnitFormValues) => {
    if (editing) {
      await updateOrganization.mutateAsync(values);
    } else {
      await createOrganization.mutateAsync(values);
    }
    toast.success(editing ? 'Đã lưu đơn vị' : 'Đã thêm đơn vị');
    setIsFormOpen(false);
  };

  const remove = async (organization: OrganizationUnit) => {
    if (!(await confirm({ title: `Xóa ${organization.name}?`, description: 'Chỉ xóa được đơn vị không còn đoàn viên.', confirmLabel: 'Xóa', tone: 'danger' }))) return;
    deleteOrganization.mutate(organization.id, {
      onSuccess: () => toast.success(`Đã xóa ${organization.name}`),
      onError: (caught) => toast.error(toApiError(caught).message ?? 'Không xóa được đơn vị'),
    });
  };

  if (organizationsQuery.error && toApiError(organizationsQuery.error).status === 403) {
    return <ForbiddenMessage />;
  }

  return (
    <>
      <PageHeader
        title="Tổ dân phố"
        description={`${organizations.filter((item) => item.type === 'YOUTH_UNION_BRANCH').length} chi đoàn`}
        actions={
          <Button onClick={() => openForm(null)}>
            <Plus size={17} aria-hidden="true" />
            Thêm đơn vị
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {organizationsQuery.isLoading && (
          <div className="p-4">
            <LoadingSkeleton rows={8} />
          </div>
        )}
        {!organizationsQuery.isLoading && organizations.length === 0 && <EmptyState title="Chưa có đơn vị" />}
        <ul className="divide-y divide-slate-100">
          {organizations.map((organization) => (
            <li key={organization.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{organization.name}</p>
                <p className="text-xs text-slate-600">
                  {typeLabel[organization.type]} · Mã {organization.code}
                  {organization.parentId && ` · thuộc ${organizations.find((item) => item.id === organization.parentId)?.name ?? '-'}`}
                </p>
              </div>
              {!organization.active && <StatusBadge value="INACTIVE" label="Ngừng hoạt động" />}
              <div className="flex gap-1">
                {organization.type === 'YOUTH_UNION_BRANCH' && (
                  <Button variant="ghost" size="sm" onClick={() => setViewing(organization)}>
                    <UsersRound size={16} aria-hidden="true" />
                    Đoàn viên
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => openForm(organization)} aria-label={`Sửa ${organization.name}`}>
                  <Pencil size={16} aria-hidden="true" />
                </Button>
                {organization.type === 'YOUTH_UNION_BRANCH' && (
                  <Button variant="ghost" size="icon" onClick={() => remove(organization)} aria-label={`Xóa ${organization.name}`} className="text-accent-700">
                    <Trash2 size={16} aria-hidden="true" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Dialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editing ? 'Sửa đơn vị' : 'Thêm đơn vị'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" form={formId} loading={createOrganization.isPending || updateOrganization.isPending}>
              {editing ? 'Lưu' : 'Thêm đơn vị'}
            </Button>
          </>
        }
      >
        {formError && <Alert className="mb-4">{formError}</Alert>}
        {isFormOpen && <OrganizationForm key={editing?.id ?? 'new'} formId={formId} initial={editing} wards={wards} onSubmit={save} onError={setFormError} />}
      </Dialog>

      <Dialog open={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing ? `Đoàn viên ${viewing.name}` : ''}>
        {membersQuery.isLoading && <LoadingSkeleton rows={6} />}
        {membersQuery.isError && <Alert>Không thể tải danh sách đoàn viên.</Alert>}
        {membersQuery.data?.length === 0 && <EmptyState title="Chưa có đoàn viên" />}
        <ul className="divide-y divide-slate-100">
          {membersQuery.data?.map((member) => (
            <li key={member.memberId}>
              <Link to={`/members/${member.memberId}`} className="block py-2.5 text-sm font-medium text-brand-700 hover:underline">
                {member.fullName}
              </Link>
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
};
