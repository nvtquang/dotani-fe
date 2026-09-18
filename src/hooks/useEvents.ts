import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventService } from '../services/eventService';
import type { EventFilters, EventFormValues, ParticipationStatus } from '../types/event';

export const eventKeys = {
  all: ['events'] as const,
  list: (filters: EventFilters) => [...eventKeys.all, 'list', filters] as const,
  detail: (id: string) => [...eventKeys.all, 'detail', id] as const,
  summary: (id: string) => [...eventKeys.all, 'detail', id, 'summary'] as const,
  participants: (id: string) => [...eventKeys.all, 'detail', id, 'participants'] as const,
  mine: () => [...eventKeys.all, 'mine'] as const,
};

export const useEvents = (filters: EventFilters) =>
  useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: () => eventService.list(filters),
  });

export const useEvent = (id: string) =>
  useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => eventService.findById(id),
    enabled: Boolean(id),
  });

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: EventFormValues) => eventService.create(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.all }),
  });
};

export const useUpdateEvent = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: EventFormValues) => eventService.update(id, values),
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      queryClient.setQueryData(eventKeys.detail(id), event);
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => eventService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.all }),
  });
};

export const useUploadEventAttachments = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (files: File[]) => eventService.uploadAttachments(id, files),
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      queryClient.setQueryData(eventKeys.detail(id), event);
    },
  });
};

export const useDeleteEventAttachment = (eventId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) => eventService.deleteAttachment(eventId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
  });
};

export const useParticipationSummary = (eventId: string) =>
  useQuery({
    queryKey: eventKeys.summary(eventId),
    queryFn: () => eventService.participationSummary(eventId),
    enabled: Boolean(eventId),
  });

export const useParticipants = (eventId: string, enabled: boolean) =>
  useQuery({
    queryKey: eventKeys.participants(eventId),
    queryFn: () => eventService.participants(eventId),
    enabled: Boolean(eventId) && enabled,
  });

export const useMyEventParticipations = () =>
  useQuery({
    queryKey: eventKeys.mine(),
    queryFn: eventService.myEvents,
  });

export const useUpdateParticipation = (eventId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: ParticipationStatus) => eventService.updateParticipation(eventId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.summary(eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.participants(eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.mine() });
    },
  });
};
