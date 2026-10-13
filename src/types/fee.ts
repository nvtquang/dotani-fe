export type FeePeriodStatus = 'OPEN' | 'CLOSED';
export type PaymentMethod = 'CASH' | 'TRANSFER';

export type FeePeriod = {
  id: string;
  name: string;
  description?: string | null;
  organizationId: string;
  organizationName?: string | null;
  amount: number;
  dueDate?: string | null;
  status: FeePeriodStatus;
  collector: {
    memberId: string;
    fullName: string;
    bankName?: string | null;
    bankCode?: string | null;
    accountNumber?: string | null;
    accountHolderName?: string | null;
    qrImageUrl?: string | null;
  } | null;
  summary: { expectedCount: number; paidCount: number; unpaidCount: number; collectedAmount: number; expectedAmount: number } | null;
  myPayment: { paid: boolean; amount: number; method?: PaymentMethod | null; paidAt?: string | null } | null;
  canManage: boolean;
  lastRemindedAt?: string | null;
  createdAt: string;
};

export type FeePeriodFormValues = {
  name: string;
  description: string;
  organizationId: string;
  amount: number;
  dueDate: string;
  collectorMemberId: string;
  status: FeePeriodStatus;
};

export type FeeMemberStatus = {
  memberId: string;
  fullName: string;
  organizationId: string;
  organizationName?: string | null;
  avatarUrl?: string | null;
  paid: boolean;
  paymentId?: string | null;
  amount?: number | null;
  method?: PaymentMethod | null;
  paidAt?: string | null;
  note?: string | null;
  recordedByName?: string | null;
};
