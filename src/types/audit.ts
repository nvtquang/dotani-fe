export type AuditAction =
  | 'CREATE_MEMBER'
  | 'UPDATE_MEMBER'
  | 'DISABLE_MEMBER'
  | 'CHANGE_ROLE'
  | 'CHANGE_ORGANIZATION'
  | 'CREATE_EVENT'
  | 'UPDATE_EVENT'
  | 'DELETE_EVENT'
  | 'CREATE_POST'
  | 'UPDATE_POST'
  | 'DELETE_POST'
  | 'CREATE_FEE_PERIOD'
  | 'UPDATE_FEE_PERIOD'
  | 'DELETE_FEE_PERIOD'
  | 'RECORD_FEE_PAYMENT'
  | 'CANCEL_FEE_PAYMENT'
  | 'REQUEST_TRANSFER'
  | 'APPROVE_TRANSFER'
  | 'REJECT_TRANSFER'
  | 'CREATE_AWARD'
  | 'UPDATE_AWARD'
  | 'DELETE_AWARD'
  | 'RATE_MEMBER'
  | 'DELETE_RATING'
  | 'CREATE_POLL'
  | 'UPDATE_POLL'
  | 'DELETE_POLL'
  | 'OPEN_POLL'
  | 'CLOSE_POLL';

export type AuditResourceType = 'MEMBER' | 'EVENT' | 'POST' | 'FEE_PERIOD' | 'TRANSFER' | 'AWARD' | 'RATING' | 'POLL';

export type AuditResult = 'SUCCESS' | 'FAILURE';

export type AuditLog = {
  id: string;
  actorUserId: string;
  actorRole: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  organizationId?: string | null;
  timestamp: string;
  result: AuditResult;
};

export type AuditLogFilters = {
  action?: AuditAction | '';
  resourceType?: AuditResourceType | '';
  organizationId?: string;
  result?: AuditResult | '';
  date?: string;
  page: number;
  size: number;
};
