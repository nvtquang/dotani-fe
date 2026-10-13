import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emulationService, type RatingBoardFilters } from '../services/emulationService';
import type { AwardFormValues, RatingLevel } from '../types/emulation';

export const emulationKeys = {
  all: ['emulation'] as const,
  profile: (memberId: string) => [...emulationKeys.all, 'profile', memberId] as const,
  board: (filters: RatingBoardFilters) => [...emulationKeys.all, 'board', filters] as const,
  summary: (year: number, organizationId: string) => [...emulationKeys.all, 'summary', year, organizationId] as const,
};

export const useEmulationProfile = (memberId?: string | null) =>
  useQuery({
    queryKey: emulationKeys.profile(memberId ?? ''),
    queryFn: () => emulationService.profile(memberId!),
    enabled: Boolean(memberId),
  });

export const useRatingBoard = (filters: RatingBoardFilters) =>
  useQuery({
    queryKey: emulationKeys.board(filters),
    queryFn: () => emulationService.board(filters),
  });

export const useEmulationSummary = (year: number, organizationId: string) =>
  useQuery({
    queryKey: emulationKeys.summary(year, organizationId),
    queryFn: () => emulationService.summary(year, organizationId),
  });

const useInvalidating = <T,>(mutationFn: (value: T) => Promise<unknown>) => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: emulationKeys.all }) });
};

export const useSaveAward = (memberId: string) =>
  useInvalidating(({ id, values }: { id?: string; values: AwardFormValues }) =>
    id ? emulationService.updateAward(id, memberId, values) : emulationService.createAward(memberId, values),
  );

export const useDeleteAward = () => useInvalidating((id: string) => emulationService.deleteAward(id));

export const useRateMember = () =>
  useInvalidating((payload: { memberId: string; year: number; rating: RatingLevel; note?: string }) => emulationService.rate(payload));

export const useDeleteRating = () => useInvalidating((id: string) => emulationService.deleteRating(id));
