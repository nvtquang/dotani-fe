import { httpClient } from '../api/httpClient';
import { localDateToIso } from '../utils/dateTime';
import type { PageResponse } from '../types/api';
import type {
  Event,
  EventFilters,
  EventFormValues,
  EventParticipation,
  ParticipationStatus,
  ParticipationSummary,
} from '../types/event';

// The form works with local dates; the API expects UTC instants.
const toInstant = (value: string | undefined, localTime: string) => {
  if (!value) {
    return value;
  }
  return value.includes('T') ? new Date(value).toISOString() : localDateToIso(value, localTime);
};

const toPayload = (values: EventFormValues) => ({
  title: values.title,
  description: values.description || null,
  type: values.type,
  location: values.location || null,
  startTime: toInstant(values.startTime, '00:00'),
  endTime: toInstant(values.endTime, '23:59'),
  registrationDeadline: values.registrationDeadline ? toInstant(values.registrationDeadline, '00:00') : null,
  organizationId: values.organizationId,
  maxParticipants: values.maxParticipants ? Number(values.maxParticipants) : null,
  status: values.status,
});

export const eventService = {
  list: async (filters: EventFilters) => {
    const { data } = await httpClient.get<PageResponse<Event>>('/api/events', {
      params: {
        type: filters.type || undefined,
        organization: filters.organization || undefined,
        status: filters.status || undefined,
        date: filters.date || undefined,
        upcoming: filters.upcoming || undefined,
        page: filters.page,
        size: filters.size,
        sort: filters.sort || 'startTime,asc',
      },
    });
    return data;
  },
  findById: async (id: string) => {
    const { data } = await httpClient.get<Event>(`/api/events/${id}`);
    return data;
  },
  create: async (values: EventFormValues) => {
    const { data } = await httpClient.post<Event>('/api/events', toPayload(values));
    return data;
  },
  update: async (id: string, values: EventFormValues) => {
    const { data } = await httpClient.put<Event>(`/api/events/${id}`, toPayload(values));
    return data;
  },
  delete: async (id: string) => {
    await httpClient.delete(`/api/events/${id}`);
  },
  uploadAttachments: async (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const { data } = await httpClient.post<Event>(`/api/events/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  deleteAttachment: async (eventId: string, attachmentId: string) => {
    await httpClient.delete(`/api/events/${eventId}/attachments/${attachmentId}`);
  },
  updateParticipation: async (eventId: string, status: ParticipationStatus) => {
    const { data } = await httpClient.put<EventParticipation>(`/api/events/${eventId}/participation`, { status });
    return data;
  },
  participants: async (eventId: string) => {
    const { data } = await httpClient.get<PageResponse<EventParticipation>>(`/api/events/${eventId}/participants`, {
      params: { size: 500 },
    });
    return data.content;
  },
  participationSummary: async (eventId: string) => {
    const { data } = await httpClient.get<ParticipationSummary>(`/api/events/${eventId}/participation-summary`);
    return data;
  },
  myEvents: async () => {
    const { data } = await httpClient.get<PageResponse<EventParticipation>>('/api/events/me', { params: { size: 200 } });
    return data.content;
  },
};
