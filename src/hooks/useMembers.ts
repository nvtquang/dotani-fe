import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { memberService, type ProfileFormValues } from '../services/memberService';
import type { BankingFormValues } from '../types/banking';
import type { Member, MemberFilters, MemberFormValues, MemberRole } from '../types/member';

export const memberKeys = {
  all: ['members'] as const,
  me: () => [...memberKeys.all, 'me'] as const,
  myBanking: () => [...memberKeys.all, 'me', 'banking'] as const,
  banking: (id: string) => [...memberKeys.all, 'detail', id, 'banking'] as const,
  list: (filters: MemberFilters) => [...memberKeys.all, 'list', filters] as const,
  directory: (keyword: string) => [...memberKeys.all, 'directory', keyword] as const,
  detail: (id: string) => [...memberKeys.all, 'detail', id] as const,
};

export const useMyProfile = (enabled = true) =>
  useQuery({
    queryKey: memberKeys.me(),
    queryFn: memberService.me,
    enabled,
  });

export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ProfileFormValues) => memberService.updateMe(values),
    onSuccess: (member) => {
      queryClient.setQueryData(memberKeys.me(), member);
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => memberService.uploadAvatar(file),
    onSuccess: (member) => {
      queryClient.setQueryData(memberKeys.me(), member);
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
};

export const useDeleteAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: memberService.deleteAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.me() });
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
};

export const useMembers = (filters: MemberFilters) =>
  useQuery({
    queryKey: memberKeys.list(filters),
    queryFn: () => memberService.list(filters),
  });

export const useMemberDirectory = (keyword: string, enabled = true) =>
  useQuery({
    queryKey: memberKeys.directory(keyword),
    queryFn: () => memberService.directory(keyword),
    enabled: enabled && keyword.trim().length >= 2,
  });

export const useMember = (id: string) =>
  useQuery({
    queryKey: memberKeys.detail(id),
    queryFn: () => memberService.findById(id),
    enabled: Boolean(id),
  });

export const useMemberNameMap = (ids: string[]) => {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  const queries = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: memberKeys.detail(id),
      queryFn: () => memberService.findById(id),
      enabled: Boolean(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  return uniqueIds.reduce<Record<string, string>>((result, id, index) => {
    result[id] = queries[index]?.data?.fullName ?? 'Đoàn viên';
    return result;
  }, {});
};

export const useMemberMap = (ids: string[]) => {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  const queries = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: memberKeys.detail(id),
      queryFn: () => memberService.findById(id),
      enabled: Boolean(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  return uniqueIds.reduce<Record<string, Member>>((result, id, index) => {
    const member = queries[index]?.data;
    if (member) {
      result[id] = member;
    }
    return result;
  }, {});
};

export const useCreateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: MemberFormValues) => memberService.create(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: memberKeys.all }),
  });
};

export const useUpdateMember = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: MemberFormValues) => memberService.update(id, values),
    onSuccess: (member) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
      queryClient.setQueryData(memberKeys.detail(id), member);
    },
  });
};

export const useDisableMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => memberService.disable(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: memberKeys.all }),
  });
};

export const useUpdateMemberRole = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (role: MemberRole) => memberService.updateRole(id, role),
    onSuccess: (member) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
      queryClient.setQueryData(memberKeys.detail(id), member);
    },
  });
};

export const useMyBanking = (enabled = true) =>
  useQuery({
    queryKey: memberKeys.myBanking(),
    queryFn: memberService.myBanking,
    enabled,
  });

export const useMemberBanking = (id: string) =>
  useQuery({
    queryKey: memberKeys.banking(id),
    queryFn: () => memberService.memberBanking(id),
    enabled: Boolean(id),
  });

export const useUpdateMyBanking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: BankingFormValues) => memberService.updateMyBanking(values),
    onSuccess: (banking) => queryClient.setQueryData(memberKeys.myBanking(), banking),
  });
};

export const useUploadBankQr = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => memberService.uploadBankQr(file),
    onSuccess: (banking) => queryClient.setQueryData(memberKeys.myBanking(), banking),
  });
};

export const useDeleteBankQr = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: memberService.deleteBankQr,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: memberKeys.myBanking() }),
  });
};
