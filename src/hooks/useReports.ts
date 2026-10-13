import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/reportService';
import type { PeriodGranularity } from '../types/report';

export const reportKeys = {
  all: ['reports'] as const,
  members: (organizationId: string) => [...reportKeys.all, 'members', organizationId] as const,
  participation: (year: number, granularity: PeriodGranularity, organizationId: string) =>
    [...reportKeys.all, 'participation', year, granularity, organizationId] as const,
};

export const useMemberReport = (organizationId: string) =>
  useQuery({
    queryKey: reportKeys.members(organizationId),
    queryFn: () => reportService.members(organizationId),
  });

export const useParticipationReport = (year: number, granularity: PeriodGranularity, organizationId: string) =>
  useQuery({
    queryKey: reportKeys.participation(year, granularity, organizationId),
    queryFn: () => reportService.participation(year, granularity, organizationId),
  });
