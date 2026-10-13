import { httpClient } from '../api/httpClient';
import type { MemberReport, ParticipationReport, PeriodGranularity } from '../types/report';

export const reportService = {
  members: async (organizationId?: string) => {
    const { data } = await httpClient.get<MemberReport>('/api/reports/members', { params: { organizationId: organizationId || undefined } });
    return data;
  },
  participation: async (year: number, granularity: PeriodGranularity, organizationId?: string) => {
    const { data } = await httpClient.get<ParticipationReport>('/api/reports/participation', {
      params: { year, granularity, organizationId: organizationId || undefined },
    });
    return data;
  },
};
