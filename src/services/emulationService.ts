import { httpClient } from '../api/httpClient';
import type { PageResponse } from '../types/api';
import type { Award, AwardFormValues, EmulationProfile, EmulationSummary, Rating, RatingBoardRow, RatingLevel } from '../types/emulation';

const toAwardPayload = (memberId: string, values: AwardFormValues) => ({
  memberId,
  form: values.form,
  title: values.title,
  reason: values.reason || null,
  decisionNumber: values.decisionNumber || null,
  decisionDate: values.decisionDate,
  issuer: values.issuer || null,
});

export type RatingBoardFilters = { year: number; organizationId?: string; keyword?: string; page: number; size: number };

export const emulationService = {
  profile: async (memberId: string) => {
    const { data } = await httpClient.get<EmulationProfile>(`/api/emulation/members/${memberId}`);
    return data;
  },
  createAward: async (memberId: string, values: AwardFormValues) => {
    const { data } = await httpClient.post<Award>('/api/emulation/awards', toAwardPayload(memberId, values));
    return data;
  },
  updateAward: async (id: string, memberId: string, values: AwardFormValues) => {
    const { data } = await httpClient.put<Award>(`/api/emulation/awards/${id}`, toAwardPayload(memberId, values));
    return data;
  },
  deleteAward: async (id: string) => {
    await httpClient.delete(`/api/emulation/awards/${id}`);
  },
  rate: async (payload: { memberId: string; year: number; rating: RatingLevel; note?: string }) => {
    const { data } = await httpClient.put<Rating>('/api/emulation/ratings', payload);
    return data;
  },
  deleteRating: async (id: string) => {
    await httpClient.delete(`/api/emulation/ratings/${id}`);
  },
  board: async (filters: RatingBoardFilters) => {
    const { data } = await httpClient.get<PageResponse<RatingBoardRow>>('/api/emulation/ratings', {
      params: { year: filters.year, organizationId: filters.organizationId || undefined, keyword: filters.keyword || undefined, page: filters.page, size: filters.size },
    });
    return data;
  },
  summary: async (year: number, organizationId?: string) => {
    const { data } = await httpClient.get<EmulationSummary>('/api/emulation/summary', { params: { year, organizationId: organizationId || undefined } });
    return data;
  },
};
