import { useDeferredValue, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';
import { ForbiddenMessage } from '../../components/ForbiddenMessage';
import { Alert, Button, Card, Dialog, EmptyState, Input, LoadingSkeleton, PageHeader, Pagination, Select, Skeleton, StatusBadge, UserAvatar, useToast } from '../../components/ui';
import { MemberForm } from '../../features/members/MemberForm';
import { useCreateMember, useMembers } from '../../hooks/useMembers';
import { useOrganizations } from '../../hooks/useOrganizations';
import { isTdpRole } from '../../routes/navigation';
import { useAuth } from '../../stores/AuthContext';
import type { MemberFormValues, MemberRole, MemberStatus } from '../../types/member';
import { toApiError } from '../../utils/apiError';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { memberStatusLabel, roleLabel } from '../../utils/labels';

export const MemberListPage = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const formId = useId();
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const deferredKeyword = useDeferredValue(keyword.trim());
  const [organizationId, setOrganizationId] = useState('');
  const [status, setStatus] = useState<MemberStatus | ''>('');
  const [memberRole, setMemberRole] = useState<MemberRole | ''>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const tdpOfficer = isTdpRole(role);
  const fixedOrganizationId = tdpOfficer ? user?.tdpId : undefined;
  const organizationsQuery = useOrganizations();
  const branches = (organizationsQuery.data ?? []).filter(
    (organization) => organization.type === 'YOUTH_UNION_BRANCH' && (!fixedOrganizationId || organization.id === fixedOrganizationId),
  );

  const membersQuery = useMembers({
    keyword: deferredKeyword,
    organizationId: fixedOrganizationId ?? organizationId,
    status,
    role: memberRole,
    page,
    size: 20,
  });
  const createMember = useCreateMember();
  const members = membersQuery.data?.content ?? [];

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(0);
  };

  const handleCreate = async (values: MemberFormValues) => {
    const created = await createMember.mutateAsync(values);
    toast.success(`Đã thêm ${created.fullName}`);
    setIsCreateOpen(false);
    navigate(`/members/${created.id}`);
  };

  if (membersQuery.error && toApiError(membersQuery.error).status === 403) {
    return <ForbiddenMessage />;
  }

  return (
    <>
      <PageHeader
        title={tdpOfficer ? 'Đoàn viên TDP' : 'Đoàn viên'}
        description={membersQuery.data ? `${membersQuery.data.totalElements} đoàn viên` : undefined}
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <UserPlus size={17} aria-hidden="true" />
            Thêm đoàn viên
          </Button>
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <Input className="pl-9" placeholder="Tên, email, số điện thoại" aria-label="Tìm đoàn viên" value={keyword} onChange={(event) => resetPage(setKeyword)(event.target.value)} />
        </div>
        {!tdpOfficer && (
          <Select aria-label="Tổ dân phố" value={organizationId} onChange={(event) => resetPage(setOrganizationId)(event.target.value)}>
            <option value="">Mọi tổ dân phố</option>
            {branches.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </Select>
        )}
        <Select aria-label="Trạng thái" value={status} onChange={(event) => resetPage(setStatus)(event.target.value as MemberStatus | '')}>
          <option value="">Mọi trạng thái</option>
          {(Object.keys(memberStatusLabel) as MemberStatus[]).map((item) => (
            <option key={item} value={item}>
              {memberStatusLabel[item]}
            </option>
          ))}
        </Select>
        <Select aria-label="Vai trò" value={memberRole} onChange={(event) => resetPage(setMemberRole)(event.target.value as MemberRole | '')}>
          <option value="">Mọi vai trò</option>
          {(Object.keys(roleLabel) as MemberRole[]).map((item) => (
            <option key={item} value={item}>
              {roleLabel[item]}
            </option>
          ))}
        </Select>
      </div>

      <Card className="overflow-hidden">
        {membersQuery.isLoading && (
          <div className="p-4">
            <LoadingSkeleton rows={8} />
          </div>
        )}
        {!membersQuery.isLoading && members.length === 0 && <EmptyState title="Không có đoàn viên" description="Thử đổi từ khóa hoặc bộ lọc." />}

        {members.length > 0 && (
          <>
            {/* phones: one card per member */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {members.map((member) => (
                <li key={member.id}>
                  <Link to={`/members/${member.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                    <UserAvatar name={member.fullName} src={resolveAssetUrl(member.avatarUrl)} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">{member.fullName}</span>
                      <span className="block truncate text-xs text-slate-600">
                        {roleLabel[member.memberRole]} · {member.organizationName || 'Chưa có TDP'}
                      </span>
                    </span>
                    {member.memberStatus !== 'ACTIVE' && <StatusBadge value={member.memberStatus} label={memberStatusLabel[member.memberStatus]} />}
                  </Link>
                </li>
              ))}
            </ul>

            {/* wider screens: table */}
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Đoàn viên</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Liên hệ</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Tổ dân phố</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Vai trò</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <Link to={`/members/${member.id}`} className="flex items-center gap-3 font-semibold text-slate-900 hover:text-brand-700">
                        <UserAvatar name={member.fullName} src={resolveAssetUrl(member.avatarUrl)} size="sm" />
                        {member.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">
                      <span className="block">{member.phone || '-'}</span>
                      <span className="block text-xs text-slate-600">{member.email}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{member.organizationName || 'Chưa có TDP'}</td>
                    <td className="px-4 py-2.5 text-slate-700">{roleLabel[member.memberRole]}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge value={member.memberStatus} label={memberStatusLabel[member.memberStatus]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>

      <Pagination page={page} totalPages={membersQuery.data?.totalPages ?? 0} onChange={setPage} />

      <Dialog
        open={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setFormError(null);
        }}
        title="Thêm đoàn viên"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" form={formId} loading={createMember.isPending}>
              Thêm đoàn viên
            </Button>
          </>
        }
      >
        {formError && <Alert className="mb-4">{formError}</Alert>}
        {organizationsQuery.isLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <MemberForm formId={formId} organizations={branches} fixedOrganizationId={fixedOrganizationId} onSubmit={handleCreate} onError={setFormError} />
        )}
      </Dialog>
    </>
  );
};
