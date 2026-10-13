import { httpClient } from '../api/httpClient';
import type { PageResponse } from '../types/api';
import type { MemberTransfer, TransferStatus } from '../types/transfer';

export type TransferFilters = { status?: TransferStatus | ''; memberId?: string; page: number; size: number };

export const transferService = {
  list: async (filters: TransferFilters) => {
    const { data } = await httpClient.get<PageResponse<MemberTransfer>>('/api/member-transfers', {
      params: { status: filters.status || undefined, memberId: filters.memberId || undefined, page: filters.page, size: filters.size },
    });
    return data;
  },
  request: async (payload: { memberId?: string; toOrganizationId: string; reason?: string }) => {
    const { data } = await httpClient.post<MemberTransfer>('/api/member-transfers', payload);
    return data;
  },
  approve: async (id: string, note?: string) => {
    const { data } = await httpClient.post<MemberTransfer>(`/api/member-transfers/${id}/approve`, { note: note || null });
    return data;
  },
  reject: async (id: string, note?: string) => {
    const { data } = await httpClient.post<MemberTransfer>(`/api/member-transfers/${id}/reject`, { note: note || null });
    return data;
  },
  cancel: async (id: string) => {
    const { data } = await httpClient.post<MemberTransfer>(`/api/member-transfers/${id}/cancel`);
    return data;
  },
};
