export type TransferStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type MemberTransfer = {
  id: string;
  memberId: string;
  memberName?: string | null;
  memberAvatarUrl?: string | null;
  fromOrganizationId: string;
  fromOrganizationName?: string | null;
  toOrganizationId: string;
  toOrganizationName?: string | null;
  reason?: string | null;
  status: TransferStatus;
  requestedById?: string | null;
  requestedByName?: string | null;
  requestedAt: string;
  decidedById?: string | null;
  decidedByName?: string | null;
  decidedAt?: string | null;
  decisionNote?: string | null;
  canDecide: boolean;
  canCancel: boolean;
};
