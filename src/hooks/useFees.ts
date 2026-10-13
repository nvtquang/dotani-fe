import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { feeService, type FeeMemberFilters } from '../services/feeService';
import type { FeePeriodFormValues, FeePeriodStatus, PaymentMethod } from '../types/fee';

export const feeKeys = {
  all: ['fees'] as const,
  list: (status: string, page: number) => [...feeKeys.all, 'list', status, page] as const,
  detail: (id: string) => [...feeKeys.all, 'detail', id] as const,
  members: (id: string, filters: FeeMemberFilters) => [...feeKeys.all, 'detail', id, 'members', filters] as const,
};

export const useFeePeriods = (status: FeePeriodStatus | '', page: number) =>
  useQuery({
    queryKey: feeKeys.list(status, page),
    queryFn: () => feeService.list(status, page),
  });

export const useFeePeriod = (id: string) =>
  useQuery({
    queryKey: feeKeys.detail(id),
    queryFn: () => feeService.findById(id),
    enabled: Boolean(id),
  });

export const useFeeMembers = (id: string, filters: FeeMemberFilters, enabled: boolean) =>
  useQuery({
    queryKey: feeKeys.members(id, filters),
    queryFn: () => feeService.members(id, filters),
    enabled: Boolean(id) && enabled,
  });

export const useSaveFeePeriod = (id?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: FeePeriodFormValues) => (id ? feeService.update(id, values) : feeService.create(values)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feeKeys.all }),
  });
};

export const useDeleteFeePeriod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => feeService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feeKeys.all }),
  });
};

export const useRecordPayment = (periodId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payment: { memberId: string; method: PaymentMethod; amount?: number; note?: string }) => feeService.recordPayment(periodId, payment),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feeKeys.all }),
  });
};

export const useCancelPayment = (periodId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) => feeService.cancelPayment(periodId, paymentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feeKeys.all }),
  });
};

export const useRemindFee = (periodId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => feeService.remind(periodId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feeKeys.detail(periodId) }),
  });
};
