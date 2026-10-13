import { useMemo, useState } from 'react';
import { ForbiddenMessage } from '../../components/ForbiddenMessage';
import { Alert, Card, EmptyState, Input, LoadingSkeleton, PageHeader, Pagination, Select, StatusBadge, Time } from '../../components/ui';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { useMemberNameMap } from '../../hooks/useMembers';
import { useOrganizations } from '../../hooks/useOrganizations';
import type { AuditAction, AuditResourceType, AuditResult } from '../../types/audit';
import { toApiError } from '../../utils/apiError';
import { roleLabel, shortId } from '../../utils/labels';

const actionLabel: Record<AuditAction, string> = {
  CREATE_MEMBER: 'Tạo đoàn viên',
  UPDATE_MEMBER: 'Cập nhật đoàn viên',
  DISABLE_MEMBER: 'Vô hiệu hóa đoàn viên',
  CHANGE_ROLE: 'Thay đổi phân quyền',
  CHANGE_ORGANIZATION: 'Chuyển TDP',
  CREATE_EVENT: 'Tạo sự kiện',
  UPDATE_EVENT: 'Cập nhật sự kiện',
  DELETE_EVENT: 'Xóa sự kiện',
  CREATE_POST: 'Tạo bài viết',
  UPDATE_POST: 'Cập nhật bài viết',
  DELETE_POST: 'Xóa bài viết',
};

const resourceLabel: Record<AuditResourceType, string> = {
  MEMBER: 'Đoàn viên',
  EVENT: 'Sự kiện',
  POST: 'Bài viết',
};

export const AuditPage = () => {
  const [page, setPage] = useState(0);
  const [action, setAction] = useState<AuditAction | ''>('');
  const [resourceType, setResourceType] = useState<AuditResourceType | ''>('');
  const [organizationId, setOrganizationId] = useState('');
  const [result, setResult] = useState<AuditResult | ''>('');
  const [date, setDate] = useState('');
  const organizationsQuery = useOrganizations();

  const auditQuery = useAuditLogs({ action, resourceType, organizationId, result, date, page, size: 20 });
  const logs = useMemo(() => auditQuery.data?.content ?? [], [auditQuery.data]);
  const memberIds = useMemo(() => logs.filter((log) => log.resourceType === 'MEMBER').map((log) => log.resourceId), [logs]);
  const memberNames = useMemberNameMap(memberIds);

  const organizationName = (id?: string | null) => (id ? (organizationsQuery.data ?? []).find((item) => item.id === id)?.name ?? shortId(id) : null);
  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(0);
  };

  if (auditQuery.error && toApiError(auditQuery.error).status === 403) {
    return <ForbiddenMessage />;
  }

  return (
    <>
      <PageHeader title="Nhật ký hệ thống" description="Thay đổi đoàn viên, phân quyền, sự kiện và bài viết" />

      <div className="mb-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Select aria-label="Thao tác" value={action} onChange={(event) => resetPage(setAction)(event.target.value as AuditAction | '')}>
          <option value="">Mọi thao tác</option>
          {(Object.keys(actionLabel) as AuditAction[]).map((item) => (
            <option key={item} value={item}>
              {actionLabel[item]}
            </option>
          ))}
        </Select>
        <Select aria-label="Đối tượng" value={resourceType} onChange={(event) => resetPage(setResourceType)(event.target.value as AuditResourceType | '')}>
          <option value="">Mọi đối tượng</option>
          {(Object.keys(resourceLabel) as AuditResourceType[]).map((item) => (
            <option key={item} value={item}>
              {resourceLabel[item]}
            </option>
          ))}
        </Select>
        <Select aria-label="Đơn vị" value={organizationId} onChange={(event) => resetPage(setOrganizationId)(event.target.value)}>
          <option value="">Mọi đơn vị</option>
          {(organizationsQuery.data ?? []).map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Kết quả" value={result} onChange={(event) => resetPage(setResult)(event.target.value as AuditResult | '')}>
          <option value="">Mọi kết quả</option>
          <option value="SUCCESS">Thành công</option>
          <option value="FAILURE">Thất bại</option>
        </Select>
        <Input type="date" aria-label="Ngày" value={date} onChange={(event) => resetPage(setDate)(event.target.value)} />
      </div>

      <Card className="overflow-hidden">
        {auditQuery.isLoading && (
          <div className="p-4">
            <LoadingSkeleton rows={8} />
          </div>
        )}
        {auditQuery.isError && <Alert className="m-4">Không thể tải nhật ký.</Alert>}
        {!auditQuery.isLoading && logs.length === 0 && <EmptyState title="Không có bản ghi" description="Thử đổi bộ lọc hoặc ngày." />}
        <ul className="divide-y divide-slate-100">
          {logs.map((log) => (
            <li key={log.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">
                  {actionLabel[log.action]}
                  <span className="font-normal text-slate-700">
                    {' '}
                    · {resourceLabel[log.resourceType]} {log.resourceType === 'MEMBER' ? (memberNames[log.resourceId] ?? '') : shortId(log.resourceId)}
                  </span>
                </p>
                <p className="text-xs text-slate-600">
                  {roleLabel[log.actorRole as keyof typeof roleLabel] ?? log.actorRole} {shortId(log.actorUserId)}
                  {organizationName(log.organizationId) && ` · ${organizationName(log.organizationId)}`} · <Time value={log.timestamp} />
                </p>
              </div>
              <StatusBadge value={log.result} label={log.result === 'SUCCESS' ? 'Thành công' : 'Thất bại'} />
            </li>
          ))}
        </ul>
      </Card>

      <Pagination page={page} totalPages={auditQuery.data?.totalPages ?? 0} onChange={setPage} />
    </>
  );
};
