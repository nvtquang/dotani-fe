import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transferService, type TransferFilters } from '../services/transferService';
import { memberKeys } from './useMembers';

export const transferKeys = {
  all: ['transfers'] as const,
  list: (filters: TransferFilters) => [...transferKeys.all, 'list', filters] as const,
};

export const useTransfers = (filters: TransferFilters, enabled = true) =>
  useQuery({
    queryKey: transferKeys.list(filters),
    queryFn: () => transferService.list(filters),
    enabled,
  });

export const useRequestTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: transferService.request,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transferKeys.all }),
  });
};

/** approve / reject / cancel; approving moves the member, so member data is refreshed too */
export const useDecideTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: 'approve' | 'reject' | 'cancel'; note?: string }) =>
      action === 'approve' ? transferService.approve(id, note) : action === 'reject' ? transferService.reject(id, note) : transferService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transferKeys.all });
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
};
