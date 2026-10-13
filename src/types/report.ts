export type ReportCount = { key: string; count: number };

export type OrganizationMembers = {
  organizationId: string;
  organizationName: string;
  total: number;
  active: number;
  male: number;
  female: number;
  otherOrUnknown: number;
};

export type MemberReport = {
  totalMembers: number;
  activeMembers: number;
  statusCounts: Record<string, number>;
  genderCounts: Record<string, number>;
  ageGroups: ReportCount[];
  averageAge: number | null;
  byOrganization: OrganizationMembers[];
};

export type PeriodGranularity = 'MONTH' | 'QUARTER';

export type ParticipationRow = {
  key: string;
  label: string;
  eventCount: number;
  invitedCount: number;
  goingCount: number;
  notGoingCount: number;
  undecidedCount: number;
  rate: number | null;
};

export type ParticipationReport = {
  year: number;
  granularity: PeriodGranularity;
  periods: ParticipationRow[];
  total: ParticipationRow;
  byOrganization: Array<{ organizationId: string; organizationName: string | null; invitedCount: number; goingCount: number; rate: number | null }>;
  events: Array<{
    eventId: string;
    title: string;
    startTime: string;
    organizationId: string;
    organizationName: string | null;
    invitedCount: number;
    goingCount: number;
    rate: number | null;
  }>;
};
