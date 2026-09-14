import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { ForbiddenMessage } from '../../components/ForbiddenMessage';
import { EmptyState, LoadingSkeleton, PageHeader, StatusBadge } from '../../components/ui';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { useMemberNameMap } from '../../hooks/useMembers';
import { useOrganizations } from '../../hooks/useOrganizations';
import { useAuth } from '../../stores/AuthContext';
import type { AuditAction, AuditLogFilters, AuditResourceType, AuditResult } from '../../types/audit';
import { toApiError } from '../../utils/apiError';
import { formatDateTime } from '../../utils/dateTime';
import { roleLabel, shortId } from '../../utils/labels';

const pageSize = 10;

const actions: AuditAction[] = [
  'CREATE_MEMBER',
  'UPDATE_MEMBER',
  'DISABLE_MEMBER',
  'CHANGE_ROLE',
  'CHANGE_ORGANIZATION',
  'CREATE_EVENT',
  'UPDATE_EVENT',
  'DELETE_EVENT',
  'CREATE_POST',
  'UPDATE_POST',
  'DELETE_POST',
];

const resourceTypes: AuditResourceType[] = ['MEMBER', 'EVENT', 'POST'];
const results: AuditResult[] = ['SUCCESS', 'FAILURE'];

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
  const { role } = useAuth();
  const [page, setPage] = useState(0);
  const [action, setAction] = useState<AuditAction | ''>('');
  const [resourceType, setResourceType] = useState<AuditResourceType | ''>('');
  const [organizationId, setOrganizationId] = useState('');
  const [result, setResult] = useState<AuditResult | ''>('');
  const [date, setDate] = useState('');
  const organizationsQuery = useOrganizations();

  const filters: AuditLogFilters = {
    action,
    resourceType,
    organizationId,
    result,
    date,
    page,
    size: pageSize,
  };
  const auditQuery = useAuditLogs(filters);
  const logs = auditQuery.data?.content ?? [];
  const totalPages = auditQuery.data?.totalPages ?? 0;
  const isWardSecretary = role === 'WARD_SECRETARY';
  const memberResourceIds = useMemo(
    () => logs.filter((log) => log.resourceType === 'MEMBER').map((log) => log.resourceId),
    [logs],
  );
  const memberResourceNameMap = useMemberNameMap(memberResourceIds);

  const organizationName = (id?: string | null) =>
    id ? (organizationsQuery.data ?? []).find((organization) => organization.id === id)?.name ?? shortId(id) : '-';

  const resourceName = (type: AuditResourceType, id: string) => {
    if (type === 'MEMBER') {
      return memberResourceNameMap[id] ?? 'Đoàn viên';
    }
    return shortId(id);
  };

  if (auditQuery.error && toApiError(auditQuery.error).status === 403) {
    return <ForbiddenMessage />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Hệ thống"
        title={isWardSecretary ? 'Audit / Phân quyền' : 'Audit nghiệp vụ'}
        actions={
          isWardSecretary && (
            <Link className="primary-button inline-button" to="/members">
              <ShieldCheck size={17} aria-hidden="true" />
              Đi tới phân quyền
            </Link>
          )
        }
      />

      <section className="surface toolbar audit-toolbar">
        <label>
          Action
          <select
            value={action}
            onChange={(event) => {
              setAction(event.target.value as AuditAction | '');
              setPage(0);
            }}
          >
            <option value="">Tất cả</option>
            {actions.map((item) => (
              <option key={item} value={item}>
                {actionLabel[item]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Resource
          <select
            value={resourceType}
            onChange={(event) => {
              setResourceType(event.target.value as AuditResourceType | '');
              setPage(0);
            }}
          >
            <option value="">Tất cả</option>
            {resourceTypes.map((item) => (
              <option key={item} value={item}>
                {resourceLabel[item]}
              </option>
            ))}
          </select>
        </label>
        <label>
          TDP
          <select
            value={organizationId}
            onChange={(event) => {
              setOrganizationId(event.target.value);
              setPage(0);
            }}
          >
            <option value="">Tất cả</option>
            {(organizationsQuery.data ?? [])
              .filter((organization) => organization.type === 'YOUTH_UNION_BRANCH')
              .map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Kết quả
          <select
            value={result}
            onChange={(event) => {
              setResult(event.target.value as AuditResult | '');
              setPage(0);
            }}
          >
            <option value="">Tất cả</option>
            {results.map((item) => (
              <option key={item} value={item}>
                {item === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ngày
          <input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setPage(0);
            }}
          />
        </label>
      </section>

      <section className="surface section-gap">
        {auditQuery.isLoading ? (
          <LoadingSkeleton rows={8} />
        ) : (
          <div className="table-wrap">
            <table className="data-table audit-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Người thao tác</th>
                  <th>Vai trò</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>TDP</th>
                  <th>Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDateTime(log.timestamp)}</td>
                    <td>{shortId(log.actorUserId)}</td>
                    <td>{roleLabel[log.actorRole as keyof typeof roleLabel] ?? log.actorRole}</td>
                    <td>{actionLabel[log.action]}</td>
                    <td>
                      {resourceLabel[log.resourceType]} · {resourceName(log.resourceType, log.resourceId)}
                    </td>
                    <td>{organizationName(log.organizationId)}</td>
                    <td>
                      <StatusBadge
                        value={log.result === 'SUCCESS' ? 'ACTIVE' : 'INACTIVE'}
                        label={log.result === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
                      />
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState title="Chưa có audit log" description="Thử thay đổi bộ lọc hoặc ngày xem." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {auditQuery.isError && <div className="error-box">Không thể tải audit log. Vui lòng thử lại.</div>}

        <div className="pagination">
          <button
            className="secondary-button inline-button"
            type="button"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(current - 1, 0))}
          >
            Trước
          </button>
          <span>
            Trang {totalPages === 0 ? 0 : page + 1} / {totalPages}
          </span>
          <button
            className="secondary-button inline-button"
            type="button"
            disabled={totalPages === 0 || page >= totalPages - 1}
            onClick={() => setPage((current) => current + 1)}
          >
            Sau
          </button>
        </div>
      </section>
    </div>
  );
};
