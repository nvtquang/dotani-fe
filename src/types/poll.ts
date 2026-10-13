export type PollStatus = 'DRAFT' | 'OPEN' | 'CLOSED';
export type ResultsVisibility = 'ALWAYS' | 'AFTER_VOTE' | 'AFTER_CLOSE';

export type PollOption = {
  id: string;
  label: string;
  position: number;
  voteCount?: number | null;
  voters?: Array<{ memberId: string; fullName?: string | null }> | null;
};

export type Poll = {
  id: string;
  title: string;
  description?: string | null;
  organizationId: string;
  organizationName?: string | null;
  eventId?: string | null;
  anonymous: boolean;
  maxChoices: number;
  resultsVisibility: ResultsVisibility;
  status: PollStatus;
  closesAt?: string | null;
  openedAt?: string | null;
  closedAt?: string | null;
  createdByName?: string | null;
  createdAt: string;
  options: PollOption[];
  eligibleCount: number;
  ballotCount: number;
  eligible: boolean;
  hasVoted: boolean;
  myOptionIds: string[];
  resultsVisible: boolean;
  canManage: boolean;
};

export type PollFormValues = {
  title: string;
  description: string;
  organizationId: string;
  eventId?: string | null;
  anonymous: boolean;
  maxChoices: number;
  resultsVisibility: ResultsVisibility;
  closesAt: string;
  options: string[];
  open?: boolean;
};
