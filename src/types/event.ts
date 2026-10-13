export type EventType = 'EVENT' | 'MEETING' | 'CONGRESS' | 'TASK' | 'ACTIVITY';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

export type ParticipationStatus = 'GOING' | 'NOT_GOING' | 'UNDECIDED';

export type Event = {
  id: string;
  title: string;
  description?: string | null;
  type: EventType;
  location?: string | null;
  startTime: string;
  endTime: string;
  registrationDeadline?: string | null;
  organizationId: string;
  organizationName?: string | null;
  maxParticipants?: number | null;
  /** members registered GOING */
  goingCount?: number;
  status: EventStatus;
  createdBy?: string | null;
  attachments?: EventAttachment[];
  createdAt?: string;
  updatedAt?: string;
};

export type EventAttachment = {
  id: string;
  fileUrl: string;
  attachmentKind: 'IMAGE' | 'FILE' | string;
  fileName?: string | null;
  createdAt?: string;
};

export type EventFormValues = {
  title: string;
  description?: string;
  type: EventType;
  location?: string;
  startTime: string;
  endTime: string;
  registrationDeadline?: string;
  organizationId: string;
  organizationIds?: string[];
  maxParticipants?: string;
  status: EventStatus;
};

export type EventFilters = {
  type?: EventType | '';
  organization?: string;
  status?: EventStatus | '';
  date?: string;
  when?: 'UPCOMING' | 'PAST';
  /** ISO instants bounding startTime, for the calendar */
  from?: string;
  to?: string;
  /** only events I registered GOING for */
  participating?: boolean;
  page: number;
  size: number;
  sort?: string;
};

export type EventParticipation = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventType: EventType;
  eventOrganizationId: string;
  eventStartTime: string;
  eventEndTime: string;
  memberId: string;
  participantName?: string | null;
  status: ParticipationStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type ParticipationSummary = {
  going: number;
  notGoing: number;
  undecided: number;
};
