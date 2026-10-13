import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pollService, type PollFilters } from '../services/pollService';
import type { Poll, PollFormValues } from '../types/poll';

export const pollKeys = {
  all: ['polls'] as const,
  list: (filters: PollFilters) => [...pollKeys.all, 'list', filters] as const,
  detail: (id: string) => [...pollKeys.all, 'detail', id] as const,
};

export const usePolls = (filters: PollFilters, enabled = true) =>
  useQuery({
    queryKey: pollKeys.list(filters),
    queryFn: () => pollService.list(filters),
    enabled,
  });

export const usePoll = (id: string) =>
  useQuery({
    queryKey: pollKeys.detail(id),
    queryFn: () => pollService.findById(id),
    enabled: Boolean(id),
  });

const usePollMutation = <T,>(mutationFn: (value: T) => Promise<Poll | void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (poll) => {
      queryClient.invalidateQueries({ queryKey: pollKeys.all });
      if (poll) queryClient.setQueryData(pollKeys.detail(poll.id), poll);
    },
  });
};

export const useSavePoll = (id?: string) => usePollMutation((values: PollFormValues) => (id ? pollService.update(id, values) : pollService.create(values)));
export const usePollAction = () =>
  usePollMutation(({ id, action }: { id: string; action: 'open' | 'close' }) => (action === 'open' ? pollService.open(id) : pollService.close(id)));
export const useDeletePoll = () => usePollMutation((id: string) => pollService.delete(id));
export const useVote = (id: string) => usePollMutation((optionIds: string[]) => pollService.vote(id, optionIds));
