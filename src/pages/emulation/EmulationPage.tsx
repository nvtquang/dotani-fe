import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ForbiddenMessage } from '../../components/ForbiddenMessage';
import { Alert, Card, EmptyState, Input, LoadingSkeleton, PageHeader, Pagination, Select, UserAvatar, useToast } from '../../components/ui';
import { BarList, StatTile } from '../../features/reports/Charts';
import { useEmulationSummary, useRateMember, useRatingBoard } from '../../hooks/useEmulation';
import { useOrganizations } from '../../hooks/useOrganizations';
import { isWardRole } from '../../routes/navigation';
import { useAuth } from '../../stores/AuthContext';
import type { RatingLevel } from '../../types/emulation';
import { toApiError } from '../../utils/apiError';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { ratingLabel } from '../../utils/labels';

const ratingLevels = Object.keys(ratingLabel) as RatingLevel[];
const currentYear = new Date().getFullYear();

/** Bảng đánh giá, xếp loại đoàn viên theo năm: one select per member, saved as soon as it changes. */
export const EmulationPage = () => {
  const { role } = useAuth();
  const toast = useToast();
  const ward = isWardRole(role);
  const [year, setYear] = useState(currentYear);
  const [organizationId, setOrganizationId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const organizationsQuery = useOrganizations(ward);
  const boardQuery = useRatingBoard({ year, organizationId, keyword: keyword.trim(), page, size: 30 });
  const summaryQuery = useEmulationSummary(year, organizationId);
  const rate = useRateMember();

  if (boardQuery.error && toApiError(boardQuery.error).status === 403) {
    return <ForbiddenMessage />;
  }

  const summary = summaryQuery.data;
  const rows = boardQuery.data?.content ?? [];
  const rated = summary ? summary.memberCount - (summary.ratingCounts.UNRATED ?? 0) : 0;

  return (
    <>
      <PageHeader
        title="Thi đua – khen thưởng"
        description="Đánh giá, xếp loại đoàn viên hằng năm. Khen thưởng, kỷ luật ghi trong hồ sơ từng đoàn viên."
        actions={
          <div className="flex flex-wrap gap-2">
            {ward && (
              <Select aria-label="Đơn vị" value={organizationId} onChange={(event) => {
                  setOrganizationId(event.target.value);
                  setPage(0);
                }} className="w-52!">
                <option value="">Toàn phường</option>
                {(organizationsQuery.data ?? [])
                  .filter((organization) => organization.type === 'YOUTH_UNION_BRANCH')
                  .map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
              </Select>
            )}
            <Select aria-label="Năm" value={year} onChange={(event) => {
                setYear(Number(event.target.value));
                setPage(0);
              }} className="w-28!">
              {Array.from({ length: 6 }, (_, index) => currentYear - index).map((item) => (
                <option key={item} value={item}>
                  Năm {item}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      {summary && (
        <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Đã xếp loại" value={`${rated}/${summary.memberCount}`} hint={`Năm ${summary.year}`} />
            <StatTile label="Xuất sắc" value={summary.ratingCounts.EXCELLENT ?? 0} />
            <StatTile label="Khen thưởng" value={summary.commendationCount} hint="Quyết định trong năm" />
            <StatTile label="Kỷ luật" value={summary.disciplineCount} hint="Quyết định trong năm" />
          </div>
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Kết quả xếp loại năm {summary.year}</h2>
            <BarList
              label="Số đoàn viên theo kết quả xếp loại"
              data={[...ratingLevels, 'UNRATED'].map((level) => ({
                key: level,
                label: level === 'UNRATED' ? 'Chưa xếp loại' : ratingLabel[level as RatingLevel],
                value: summary.ratingCounts[level] ?? 0,
              }))}
            />
          </Card>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <Input
            type="search"
            aria-label="Tìm đoàn viên"
            placeholder="Tìm theo tên, số điện thoại"
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(0);
            }}
            className="max-w-sm"
          />
        </div>
        {boardQuery.isLoading && (
          <div className="p-4">
            <LoadingSkeleton rows={8} />
          </div>
        )}
        {boardQuery.isError && <Alert className="m-4">Không thể tải bảng xếp loại.</Alert>}
        {!boardQuery.isLoading && rows.length === 0 && <EmptyState title="Không có đoàn viên" />}
        <ul className="divide-y divide-slate-100">
          {rows.map((row) => (
            <li key={row.memberId} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <UserAvatar name={row.fullName} src={resolveAssetUrl(row.avatarUrl)} size="sm" />
              <div className="min-w-0 flex-1">
                <Link to={`/members/${row.memberId}`} className="block truncate text-sm font-semibold text-slate-900 hover:underline">
                  {row.fullName}
                </Link>
                <p className="truncate text-xs text-slate-600">{row.organizationName}</p>
              </div>
              <Select
                aria-label={`Xếp loại ${row.fullName} năm ${year}`}
                className="w-full sm:w-72"
                value={row.rating ?? ''}
                disabled={!row.canManage || rate.isPending}
                onChange={(event) => {
                  const value = event.target.value as RatingLevel;
                  if (!value) return;
                  rate.mutate(
                    { memberId: row.memberId, year, rating: value },
                    {
                      onSuccess: () => toast.success(`Đã xếp loại ${row.fullName}`),
                      onError: (caught) => toast.error(toApiError(caught).message ?? 'Không lưu được xếp loại'),
                    },
                  );
                }}
              >
                <option value="" disabled>
                  Chưa xếp loại
                </option>
                {ratingLevels.map((level) => (
                  <option key={level} value={level}>
                    {ratingLabel[level]}
                  </option>
                ))}
              </Select>
            </li>
          ))}
        </ul>
      </Card>
      <Pagination page={page} totalPages={boardQuery.data?.totalPages ?? 0} onChange={setPage} />
    </>
  );
};
