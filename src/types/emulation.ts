export type AwardForm =
  | 'PRAISE'
  | 'CERTIFICATE_OF_MERIT'
  | 'HONOR_CERTIFICATE'
  | 'OTHER_COMMENDATION'
  | 'REPRIMAND'
  | 'WARNING'
  | 'EXPULSION';
export type AwardKind = 'COMMENDATION' | 'DISCIPLINE';
export type RatingLevel = 'EXCELLENT' | 'GOOD' | 'COMPLETED' | 'NOT_COMPLETED';

export type Award = {
  id: string;
  memberId: string;
  form: AwardForm;
  kind: AwardKind;
  title: string;
  reason?: string | null;
  decisionNumber?: string | null;
  decisionDate: string;
  issuer?: string | null;
  createdByName?: string | null;
  createdAt: string;
};

export type AwardFormValues = {
  form: AwardForm;
  title: string;
  reason: string;
  decisionNumber: string;
  decisionDate: string;
  issuer: string;
};

export type Rating = {
  id: string;
  memberId: string;
  year: number;
  rating: RatingLevel;
  note?: string | null;
  ratedByName?: string | null;
  updatedAt: string;
};

export type EmulationProfile = {
  memberId: string;
  memberName: string;
  organizationName?: string | null;
  canManage: boolean;
  ratings: Rating[];
  awards: Award[];
};

export type RatingBoardRow = {
  memberId: string;
  fullName: string;
  organizationId: string;
  organizationName?: string | null;
  avatarUrl?: string | null;
  ratingId?: string | null;
  rating?: RatingLevel | null;
  note?: string | null;
  canManage: boolean;
};

export type EmulationSummary = {
  year: number;
  memberCount: number;
  ratingCounts: Record<string, number>;
  commendationCount: number;
  disciplineCount: number;
};
