import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import { ForbiddenMessage } from '../../components/ForbiddenMessage';
import { EmptyState, LoadingSkeleton, PageHeader, StatusBadge } from '../../components/ui';
import {
  useCreateOrganization,
  useDeleteOrganization,
  useOrganizationMembers,
  useOrganizations,
  useUpdateOrganization,
} from '../../hooks/useOrganizations';
import type { ApiError } from '../../types/api';
import type { OrganizationUnit, OrganizationUnitFormValues, OrganizationUnitType } from '../../types/organization';
import { toApiError } from '../../utils/apiError';

const emptyForm = (wardId?: string): OrganizationUnitFormValues => ({
  name: '',
  code: '',
  type: 'YOUTH_UNION_BRANCH',
  parentId: wardId ?? '',
  active: true,
});

const toFormValues = (organization: OrganizationUnit): OrganizationUnitFormValues => ({
  name: organization.name,
  code: organization.code,
  type: organization.type,
  parentId: organization.parentId ?? '',
  active: organization.active,
});

const typeLabel: Record<OrganizationUnitType, string> = {
  WARD: 'Phường',
  YOUTH_UNION_BRANCH: 'Chi đoàn TDP',
};

export const OrganizationPage = () => {
  const organizationsQuery = useOrganizations();
  const organizations = organizationsQuery.data ?? [];
  const wardOrganizations = useMemo(() => organizations.filter((item) => item.type === 'WARD'), [organizations]);
  const branchOrganizations = useMemo(
    () => organizations.filter((item) => item.type === 'YOUTH_UNION_BRANCH'),
    [organizations],
  );
  const defaultWardId = wardOrganizations[0]?.id;
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [editingOrganization, setEditingOrganization] = useState<OrganizationUnit | null>(null);
  const [formValues, setFormValues] = useState<OrganizationUnitFormValues>(() => emptyForm(defaultWardId));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<ApiError | null>(null);
  const createOrganization = useCreateOrganization();
  const updateOrganization = useUpdateOrganization(editingOrganization?.id ?? '');
  const deleteOrganization = useDeleteOrganization();
  const membersQuery = useOrganizationMembers(selectedOrganizationId);
  const selectedOrganization = organizations.find((item) => item.id === selectedOrganizationId);

  const openCreate = () => {
    setEditingOrganization(null);
    setFormValues(emptyForm(defaultWardId));
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (organization: OrganizationUnit) => {
    setEditingOrganization(organization);
    setFormValues(toFormValues(organization));
    setFormError(null);
    setIsFormOpen(true);
  };

  const updateField = <Key extends keyof OrganizationUnitFormValues>(
    key: Key,
    value: OrganizationUnitFormValues[Key],
  ) => {
    setFormValues((current) => {
      const next = {
        ...current,
        [key]: value,
      };

      if (key === 'type') {
        next.parentId = value === 'WARD' ? '' : current.parentId || defaultWardId || '';
      }

      return next;
    });
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    try {
      if (editingOrganization) {
        await updateOrganization.mutateAsync(formValues);
      } else {
        await createOrganization.mutateAsync(formValues);
      }
      setIsFormOpen(false);
      setEditingOrganization(null);
    } catch (error) {
      setFormError(toApiError(error));
    }
  };

  const handleDelete = async (organization: OrganizationUnit) => {
    if (!window.confirm(`Xóa ${organization.name}?`)) {
      return;
    }

    setFormError(null);
    try {
      await deleteOrganization.mutateAsync(organization.id);
      if (selectedOrganizationId === organization.id) {
        setSelectedOrganizationId('');
      }
    } catch (error) {
      setFormError(toApiError(error));
    }
  };

  if (organizationsQuery.error && toApiError(organizationsQuery.error).status === 403) {
    return <ForbiddenMessage />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Quản lý"
        title="Tổ dân phố"
        actions={
          <button className="primary-button inline-button" type="button" onClick={openCreate}>
            <Plus size={17} aria-hidden="true" />
            Thêm đơn vị
          </button>
        }
      />

      {formError?.status === 403 && <ForbiddenMessage />}
      {formError && formError.status !== 403 && <section className="error-box">{formError.message}</section>}

      {isFormOpen && (
        <section className="surface section-gap">
          <div className="section-heading">
            <h2>{editingOrganization ? 'Cập nhật đơn vị' : 'Thêm đơn vị'}</h2>
          </div>
          <form className="member-form" onSubmit={submitForm}>
            <label>
              Tên đơn vị
              <input
                required
                maxLength={255}
                value={formValues.name}
                onChange={(event) => updateField('name', event.target.value)}
              />
            </label>
            <label>
              Mã đơn vị
              <input
                required
                maxLength={100}
                value={formValues.code}
                onChange={(event) => updateField('code', event.target.value)}
              />
            </label>
            <label>
              Loại
              <select
                value={formValues.type}
                onChange={(event) => updateField('type', event.target.value as OrganizationUnitType)}
              >
                <option value="YOUTH_UNION_BRANCH">Chi đoàn TDP</option>
                <option value="WARD">Phường</option>
              </select>
            </label>
            {formValues.type === 'YOUTH_UNION_BRANCH' && (
              <label>
                Đơn vị cha
                <select
                  required
                  value={formValues.parentId || defaultWardId || ''}
                  onChange={(event) => updateField('parentId', event.target.value)}
                >
                  {wardOrganizations.map((ward) => (
                    <option key={ward.id} value={ward.id}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formValues.active}
                onChange={(event) => updateField('active', event.target.checked)}
              />
              Đang hoạt động
            </label>
            <div className="form-actions">
              <button
                className="primary-button inline-button"
                type="submit"
                disabled={createOrganization.isPending || updateOrganization.isPending}
              >
                {editingOrganization ? 'Lưu thay đổi' : 'Tạo đơn vị'}
              </button>
              <button className="secondary-button inline-button" type="button" onClick={() => setIsFormOpen(false)}>
                Hủy
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="organization-layout">
        <div className="surface section-gap">
          {organizationsQuery.isLoading ? (
            <LoadingSkeleton rows={8} />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Đơn vị</th>
                    <th>Mã</th>
                    <th>Loại</th>
                    <th>Đơn vị cha</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((organization) => (
                    <tr key={organization.id}>
                      <td>
                        <strong>{organization.name}</strong>
                      </td>
                      <td>{organization.code}</td>
                      <td>{typeLabel[organization.type]}</td>
                      <td>{organizations.find((item) => item.id === organization.parentId)?.name ?? '-'}</td>
                      <td>
                        <StatusBadge
                          value={organization.active ? 'ACTIVE' : 'INACTIVE'}
                          label={organization.active ? 'Đang hoạt động' : 'Không hoạt động'}
                        />
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="text-action"
                            type="button"
                            onClick={() => setSelectedOrganizationId(organization.id)}
                          >
                            <Eye size={16} aria-hidden="true" />
                            Xem
                          </button>
                          <button className="text-action" type="button" onClick={() => openEdit(organization)}>
                            <Pencil size={16} aria-hidden="true" />
                            Sửa
                          </button>
                          {organization.type === 'YOUTH_UNION_BRANCH' && (
                            <button
                              className="danger-link"
                              type="button"
                              disabled={deleteOrganization.isPending}
                              onClick={() => handleDelete(organization)}
                            >
                              <Trash2 size={16} aria-hidden="true" />
                              Xóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {organizations.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState title="Chưa có đơn vị tổ chức" />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="surface section-gap">
          <div className="section-heading">
            <div>
              <h2>Đoàn viên trong TDP</h2>
              <p className="page-description">
                {selectedOrganization ? selectedOrganization.name : 'Chọn một TDP để xem danh sách đoàn viên.'}
              </p>
            </div>
          </div>
          {!selectedOrganizationId && (
            <EmptyState title="Chưa chọn TDP" description="Dùng nút Xem ở bảng đơn vị để tải danh sách." />
          )}
          {selectedOrganizationId && membersQuery.isLoading && <LoadingSkeleton rows={6} />}
          {selectedOrganizationId && membersQuery.isError && (
            <div className="error-box">Không thể tải danh sách đoàn viên của đơn vị này.</div>
          )}
          {selectedOrganizationId && membersQuery.data?.length === 0 && <EmptyState title="TDP chưa có đoàn viên" />}
          {selectedOrganizationId && Boolean(membersQuery.data?.length) && (
            <div className="dashboard-list">
              {membersQuery.data?.map((member) => (
                <Link className="dashboard-list-item" key={member.memberId} to={`/members/${member.memberId}`}>
                  <div>
                    <strong>{member.fullName}</strong>
                    <span>Đoàn viên thuộc {selectedOrganization?.name ?? 'TDP'}</span>
                  </div>
                  <UsersRound size={18} aria-hidden="true" />
                </Link>
              ))}
            </div>
          )}
          {branchOrganizations.length > 0 && (
            <div className="muted-text">Có {branchOrganizations.length} Chi đoàn TDP trong danh sách hiện tại.</div>
          )}
        </aside>
      </section>
    </div>
  );
};
