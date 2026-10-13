import { httpClient } from '../api/httpClient';
import type { PageResponse } from '../types/api';
import type { Poll, PollFormValues, PollStatus } from '../types/poll';

const toPayload = (values: PollFormValues) => ({
  title: values.title,
  description: values.description || null,
  organizationId: values.organizationId,
  eventId: values.eventId || null,
  anonymous: values.anonymous,
  maxChoices: values.maxChoices,
  resultsVisibility: values.resultsVisibility,
  closesAt: values.closesAt ? new Date(values.closesAt).toISOString() : null,
  options: values.options,
  open: values.open ?? false,
});

export type PollFilters = { status?: PollStatus | ''; eventId?: string; page: number; size: number };

export const pollService = {
  list: async (filters: PollFilters) => {
    const { data } = await httpClient.get<PageResponse<Poll>>('/api/polls', {
      params: { status: filters.status || undefined, eventId: filters.eventId || undefined, page: filters.page, size: filters.size },
    });
    return data;
  },
  findById: async (id: string) => {
    const { data } = await httpClient.get<Poll>(`/api/polls/${id}`);
    return data;
  },
  create: async (values: PollFormValues) => {
    const { data } = await httpClient.post<Poll>('/api/polls', toPayload(values));
    return data;
  },
  update: async (id: string, values: PollFormValues) => {
    const { data } = await httpClient.put<Poll>(`/api/polls/${id}`, toPayload(values));
    return data;
  },
  open: async (id: string) => {
    const { data } = await httpClient.post<Poll>(`/api/polls/${id}/open`);
    return data;
  },
  close: async (id: string) => {
    const { data } = await httpClient.post<Poll>(`/api/polls/${id}/close`);
    return data;
  },
  delete: async (id: string) => {
    await httpClient.delete(`/api/polls/${id}`);
  },
  vote: async (id: string, optionIds: string[]) => {
    const { data } = await httpClient.post<Poll>(`/api/polls/${id}/votes`, { optionIds });
    return data;
  },
};
