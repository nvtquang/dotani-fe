import type { Role } from './api';

export type AuthUser = {
  userId: string;
  memberId?: string | null;
  username: string;
  email: string;
  role: Role;
  organizationId?: string | null;
  tdpId?: string | null;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInMs: number;
  user: AuthUser;
};

export type LoginRequest = {
  usernameOrEmail: string;
  password: string;
};

export type GoogleLoginRequest = {
  idToken: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  organizationId: string;
};

export type RegisterRequest = {
  username: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: string;
  organizationId: string;
};
