import { httpClient } from '../api/httpClient';
import type { PageResponse } from '../types/api';
import type { BankingFormValues, BankingInfo } from '../types/banking';
import type { Member, MemberDirectoryItem, MemberFilters, MemberFormValues, MemberRole } from '../types/member';

export type ProfileFormValues = {
  fullName: string;
  dateOfBirth?: string;
  gender?: MemberFormValues['gender'];
  phone?: string;
  email?: string;
  address?: string;
};

const toPayload = (values: MemberFormValues) => ({
  userId: values.userId || null,
  fullName: values.fullName,
  dateOfBirth: values.dateOfBirth || null,
  gender: values.gender || null,
  phone: values.phone || null,
  email: values.email || null,
  address: values.address || null,
  avatarUrl: values.avatarUrl || null,
  youthUnionJoinDate: values.youthUnionJoinDate || null,
  memberStatus: values.memberStatus || 'ACTIVE',
  organizationId: values.organizationId,
});

export const memberService = {
  me: async () => {
    const { data } = await httpClient.get<Member>('/api/members/me');
    return data;
  },
  updateMe: async (values: ProfileFormValues) => {
    const { data } = await httpClient.put<Member>('/api/members/me', {
      fullName: values.fullName,
      dateOfBirth: values.dateOfBirth || null,
      gender: values.gender || null,
      phone: values.phone || null,
      email: values.email || null,
      address: values.address || null,
    });
    return data;
  },
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await httpClient.post<Member>('/api/members/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  deleteAvatar: async () => {
    await httpClient.delete('/api/members/me/avatar');
  },
  myBanking: async () => {
    const { data } = await httpClient.get<BankingInfo>('/api/members/me/banking');
    return data;
  },
  updateMyBanking: async (values: BankingFormValues) => {
    const { data } = await httpClient.put<BankingInfo>('/api/members/me/banking', {
      bankName: values.bankName || null,
      bankCode: values.bankCode || null,
      accountNumber: values.accountNumber || null,
      accountHolderName: values.accountHolderName || null,
    });
    return data;
  },
  uploadBankQr: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await httpClient.post<BankingInfo>('/api/members/me/banking/qr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  deleteBankQr: async () => {
    await httpClient.delete('/api/members/me/banking/qr');
  },
  memberBanking: async (id: string) => {
    const { data } = await httpClient.get<BankingInfo>(`/api/members/${id}/banking`);
    return data;
  },
  list: async (filters: MemberFilters) => {
    const { data } = await httpClient.get<PageResponse<Member>>('/api/members', {
      params: {
        keyword: filters.keyword || undefined,
        organizationId: filters.organizationId || undefined,
        status: filters.status || undefined,
        role: filters.role || undefined,
        page: filters.page,
        size: filters.size,
        sort: 'fullName,asc',
      },
    });
    return data;
  },
  directory: async (keyword: string, size = 10) => {
    const { data } = await httpClient.get<PageResponse<MemberDirectoryItem>>('/api/members/directory', {
      params: {
        keyword: keyword || undefined,
        page: 0,
        size,
        sort: 'fullName,asc',
      },
    });
    return data;
  },
  lookup: async (ids: string[]) => {
    const { data } = await httpClient.post<MemberDirectoryItem[]>('/api/members/lookup', { memberIds: ids });
    return data;
  },
  findById: async (id: string) => {
    const { data } = await httpClient.get<Member>(`/api/members/${id}`);
    return data;
  },
  create: async (values: MemberFormValues) => {
    const { data } = await httpClient.post<Member>('/api/members', toPayload(values));
    return data;
  },
  update: async (id: string, values: MemberFormValues) => {
    const { data } = await httpClient.put<Member>(`/api/members/${id}`, toPayload(values));
    return data;
  },
  updateRole: async (id: string, role: MemberRole) => {
    const { data } = await httpClient.put<Member>(`/api/members/${id}/role`, { role });
    return data;
  },
  disable: async (id: string) => {
    await httpClient.delete(`/api/members/${id}`);
  },
};
