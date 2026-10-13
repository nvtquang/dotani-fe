import { httpClient } from '../api/httpClient';
import type { PageResponse } from '../types/api';
import type { FeeMemberStatus, FeePeriod, FeePeriodFormValues, FeePeriodStatus, PaymentMethod } from '../types/fee';

const toPayload = (values: FeePeriodFormValues) => ({
  name: values.name,
  description: values.description || null,
  organizationId: values.organizationId,
  amount: values.amount,
  dueDate: values.dueDate || null,
  collectorMemberId: values.collectorMemberId || null,
  status: values.status,
});

export type FeeMemberFilters = { paid?: boolean; keyword?: string; page: number; size: number };

export const feeService = {
  list: async (status?: FeePeriodStatus | '', page = 0, size = 20) => {
    const { data } = await httpClient.get<PageResponse<FeePeriod>>('/api/fees/periods', { params: { status: status || undefined, page, size } });
    return data;
  },
  findById: async (id: string) => {
    const { data } = await httpClient.get<FeePeriod>(`/api/fees/periods/${id}`);
    return data;
  },
  create: async (values: FeePeriodFormValues) => {
    const { data } = await httpClient.post<FeePeriod>('/api/fees/periods', toPayload(values));
    return data;
  },
  update: async (id: string, values: FeePeriodFormValues) => {
    const { data } = await httpClient.put<FeePeriod>(`/api/fees/periods/${id}`, toPayload(values));
    return data;
  },
  delete: async (id: string) => {
    await httpClient.delete(`/api/fees/periods/${id}`);
  },
  members: async (id: string, filters: FeeMemberFilters) => {
    const { data } = await httpClient.get<PageResponse<FeeMemberStatus>>(`/api/fees/periods/${id}/members`, {
      params: { paid: filters.paid, keyword: filters.keyword || undefined, page: filters.page, size: filters.size },
    });
    return data;
  },
  recordPayment: async (id: string, payment: { memberId: string; method: PaymentMethod; amount?: number; note?: string }) => {
    const { data } = await httpClient.post<FeeMemberStatus>(`/api/fees/periods/${id}/payments`, payment);
    return data;
  },
  cancelPayment: async (id: string, paymentId: string) => {
    await httpClient.delete(`/api/fees/periods/${id}/payments/${paymentId}`);
  },
  remind: async (id: string) => {
    const { data } = await httpClient.post<{ recipientCount: number }>(`/api/fees/periods/${id}/reminders`);
    return data;
  },
};
