import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { ForbiddenMessage } from '../../components/ForbiddenMessage';
import { Alert, Button, Card, LoadingSkeleton, PageHeader, Select, Tabs, Time } from '../../components/ui';
import { BarList, DataTable, RateColumns, StatTile, downloadCsv } from '../../features/reports/Charts';
import { useOrganizations } from '../../hooks/useOrganizations';
import { useMemberReport, useParticipationReport } from '../../hooks/useReports';
import { isWardRole } from '../../routes/navigation';
import { useAuth } from '../../stores/AuthContext';
import type { PeriodGranularity } from '../../types/report';
import { toApiError } from '../../utils/apiError';
import { formatRate, genderLabel, memberStatusLabel } from '../../utils/labels';

const ageLabel: Record<string, string> = {
  UNDER_16: 'Dưới 16',
  '16_20': '16 – 20',
  '21_25': '21 – 25',
  '26_30': '26 – 30',
  OVER_30: 'Trên 30',
  UNKNOWN: 'Chưa có ngày sinh',
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 6 }, (_, index) => currentYear - index);

const Section = ({ title, description, actions, children }: { title: string; description?: string; actions?: React.ReactNode; children: React.ReactNode }) => (
  <Card className="p-4 sm:p-6">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-slate-600">{description}</p>}
      </div>
      {actions}
    </div>
    {children}
  </Card>
);

export const ReportPage = () => {
  const { role, user } = useAuth();
  const ward = isWardRole(role);
  const [organizationId, setOrganizationId] = useState('');
  const [year, setYear] = useState(currentYear);
  const [granularity, setGranularity] = useState<PeriodGranularity>('MONTH');
  const organizationsQuery = useOrganizations(ward);
  const branches = (organizationsQuery.data ?? []).filter((organization) => organization.type === 'YOUTH_UNION_BRANCH');

  const membersQuery = useMemberReport(organizationId);
  const participationQuery = useParticipationReport(year, granularity, organizationId);

  if ([membersQuery.error, participationQuery.error].some((error) => error && toApiError(error).status === 403)) {
    return <ForbiddenMessage />;
  }

  const members = membersQuery.data;
  const participation = participationQuery.data;
  const female = members?.genderCounts.FEMALE ?? 0;

  return (
    <>
      <PageHeader
        title="Báo cáo thống kê"
        description={ward ? 'Số liệu đoàn viên và tham gia sự kiện của toàn phường hoặc từng tổ dân phố' : 'Số liệu của tổ dân phố bạn phụ trách'}
        actions={
          <div className="flex flex-wrap gap-2">
            {ward && (
              <Select aria-label="Phạm vi" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} className="w-56!">
                <option value="">Toàn phường</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
            )}
            <Select aria-label="Năm" value={year} onChange={(event) => setYear(Number(event.target.value))} className="w-28!">
              {years.map((item) => (
                <option key={item} value={item}>
                  Năm {item}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      <div className="flex flex-col gap-4">
        {membersQuery.isError && <Alert>Không thể tải số liệu đoàn viên.</Alert>}
        {membersQuery.isLoading || !members ? (
          <Card className="p-5">
            <LoadingSkeleton rows={6} />
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Tổng đoàn viên" value={members.totalMembers.toLocaleString('vi-VN')} hint={`${members.activeMembers} đang hoạt động`} />
              <StatTile
                label="Nam / Nữ"
                value={`${members.genderCounts.MALE ?? 0} / ${female}`}
                hint={members.activeMembers ? `Nữ chiếm ${formatRate(female / members.activeMembers)}` : undefined}
              />
              <StatTile label="Tuổi trung bình" value={members.averageAge ?? '-'} hint="Đoàn viên đang hoạt động có ngày sinh" />
              <StatTile
                label="Chờ duyệt / Không hoạt động"
                value={`${members.statusCounts.PENDING ?? 0} / ${members.statusCounts.INACTIVE ?? 0}`}
                hint={memberStatusLabel.PENDING}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Section
                title="Đoàn viên theo tổ dân phố"
                description="Tổng số đoàn viên của từng đơn vị"
                actions={
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      downloadCsv(
                        'doan-vien-theo-tdp.csv',
                        ['Đơn vị', 'Tổng', 'Đang hoạt động', 'Nam', 'Nữ', 'Khác/chưa rõ'],
                        members.byOrganization.map((row) => [row.organizationName, row.total, row.active, row.male, row.female, row.otherOrUnknown]),
                      )
                    }
                  >
                    <Download size={15} aria-hidden="true" />
                    CSV
                  </Button>
                }
              >
                <BarList
                  label="Số đoàn viên theo tổ dân phố"
                  data={members.byOrganization.map((row) => ({ key: row.organizationId, label: row.organizationName, value: row.total }))}
                />
                <DataTable
                  caption="Đoàn viên theo tổ dân phố"
                  head={['Đơn vị', 'Tổng', 'Hoạt động', 'Nam', 'Nữ']}
                  rows={members.byOrganization.map((row) => [row.organizationName, row.total, row.active, row.male, row.female])}
                />
              </Section>

              <Section title="Độ tuổi" description="Đoàn viên đang hoạt động theo nhóm tuổi">
                <BarList
                  label="Đoàn viên theo nhóm tuổi"
                  data={members.ageGroups.map((group) => ({ key: group.key, label: ageLabel[group.key] ?? group.key, value: group.count }))}
                />
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
                  {Object.entries(members.genderCounts).map(([gender, count]) => (
                    <span key={gender}>
                      {gender === 'UNKNOWN' ? 'Chưa rõ giới tính' : genderLabel[gender as keyof typeof genderLabel]}: <strong className="text-slate-900">{count}</strong>
                    </span>
                  ))}
                </div>
                <DataTable
                  caption="Đoàn viên theo nhóm tuổi"
                  head={['Nhóm tuổi', 'Số đoàn viên']}
                  rows={members.ageGroups.map((group) => [ageLabel[group.key] ?? group.key, group.count])}
                />
              </Section>
            </div>
          </>
        )}

        {participationQuery.isError && <Alert>Không thể tải số liệu tham gia sự kiện.</Alert>}
        <Section
          title="Tỷ lệ tham gia sự kiện"
          description="Số đoàn viên đăng ký tham gia trên số đoàn viên được mời (đoàn viên đang hoạt động của đơn vị tổ chức)"
          actions={
            <Tabs
              label="Chu kỳ"
              idPrefix="report-period"
              items={[
                { value: 'MONTH', label: 'Theo tháng' },
                { value: 'QUARTER', label: 'Theo quý' },
              ]}
              value={granularity}
              onChange={setGranularity}
              className="mx-0 border-b-0 px-0"
            />
          }
        >
          {participationQuery.isLoading || !participation ? (
            <LoadingSkeleton rows={6} />
          ) : (
            <>
              <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile label="Sự kiện" value={participation.total.eventCount} hint={`Năm ${participation.year}`} />
                <StatTile label="Lượt được mời" value={participation.total.invitedCount.toLocaleString('vi-VN')} />
                <StatTile label="Lượt tham gia" value={participation.total.goingCount.toLocaleString('vi-VN')} />
                <StatTile label="Tỷ lệ cả năm" value={formatRate(participation.total.rate)} />
              </div>
              <RateColumns
                label={`Tỷ lệ tham gia theo ${granularity === 'MONTH' ? 'tháng' : 'quý'} năm ${participation.year}`}
                data={participation.periods.map((row) => ({
                  key: row.key,
                  label: row.label,
                  value: row.rate,
                  display: row.rate === null ? undefined : formatRate(row.rate),
                  detail: `${row.goingCount}/${row.invitedCount} lượt · ${row.eventCount} sự kiện`,
                }))}
              />
              <DataTable
                caption="Tỷ lệ tham gia theo kỳ"
                head={['Kỳ', 'Sự kiện', 'Được mời', 'Tham gia', 'Không tham gia', 'Tỷ lệ']}
                rows={participation.periods.map((row) => [row.label, row.eventCount, row.invitedCount, row.goingCount, row.notGoingCount, formatRate(row.rate)])}
              />

              {participation.byOrganization.length > 1 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">Theo tổ dân phố</h3>
                  <BarList
                    label="Tỷ lệ tham gia theo tổ dân phố"
                    data={participation.byOrganization.map((row) => ({
                      key: row.organizationId,
                      label: row.organizationName ?? '-',
                      value: row.rate ?? 0,
                      display: formatRate(row.rate),
                    }))}
                  />
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Từng sự kiện ({participation.events.length})</h3>
                {participation.events.length > 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      downloadCsv(
                        `tham-gia-su-kien-${participation.year}.csv`,
                        ['Sự kiện', 'Bắt đầu', 'Đơn vị', 'Được mời', 'Tham gia', 'Tỷ lệ'],
                        participation.events.map((event) => [
                          event.title,
                          new Date(event.startTime).toLocaleString('vi-VN'),
                          event.organizationName,
                          event.invitedCount,
                          event.goingCount,
                          event.rate === null ? '' : Math.round(event.rate * 1000) / 10 + '%',
                        ]),
                      )
                    }
                  >
                    <Download size={15} aria-hidden="true" />
                    CSV
                  </Button>
                )}
              </div>
              {participation.events.length === 0 ? (
                <p className="py-4 text-sm text-slate-600">Chưa có sự kiện đã công bố trong năm {participation.year}.</p>
              ) : (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[36rem] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-600">
                        <th scope="col" className="py-2 pr-3 font-medium">Sự kiện</th>
                        <th scope="col" className="py-2 pr-3 font-medium">Thời gian</th>
                        <th scope="col" className="py-2 pr-3 text-right font-medium">Tham gia / mời</th>
                        <th scope="col" className="py-2 text-right font-medium">Tỷ lệ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participation.events.map((event) => (
                        <tr key={event.eventId} className="border-b border-slate-100">
                          <td className="py-2 pr-3">
                            <Link to={`/events/${event.eventId}`} className="font-medium text-slate-900 hover:underline">
                              {event.title}
                            </Link>
                            <span className="block text-xs text-slate-600">{event.organizationName}</span>
                          </td>
                          <td className="py-2 pr-3 text-slate-700">
                            <Time value={event.startTime} />
                          </td>
                          <td className="py-2 pr-3 text-right tabular-nums">
                            {event.goingCount}/{event.invitedCount}
                          </td>
                          <td className="py-2 text-right font-semibold tabular-nums">{formatRate(event.rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </Section>
        {!ward && user?.tdpId && <p className="text-xs text-slate-600">Số liệu chỉ gồm đoàn viên của tổ dân phố bạn phụ trách.</p>}
      </div>
    </>
  );
};
