import { httpClient } from '../api/httpClient';
import { tokenStorage } from '../api/tokenStorage';
import type { AuthResponse, AuthUser, GoogleLoginRequest, LoginRequest, RegisterRequest } from '../types/auth';

export const authService = {
  login: async (payload: LoginRequest) => {
    const { data } = await httpClient.post<AuthResponse>('/api/auth/login', payload);
    tokenStorage.setAccessToken(data.accessToken);
    tokenStorage.setRefreshToken(data.refreshToken);
    return data;
  },
  register: async (payload: RegisterRequest) => {
    const { data } = await httpClient.post<AuthResponse>('/api/auth/register', payload);
    tokenStorage.setAccessToken(data.accessToken);
    tokenStorage.setRefreshToken(data.refreshToken);
    return data;
  },
  loginWithGoogle: async (payload: GoogleLoginRequest) => {
    const { data } = await httpClient.post<AuthResponse>('/api/auth/google', payload);
    tokenStorage.setAccessToken(data.accessToken);
    tokenStorage.setRefreshToken(data.refreshToken);
    return data;
  },
  me: async () => {
    const { data } = await httpClient.get<AuthUser>('/api/auth/me');
    return data;
  },
  refresh: async (refreshToken: string) => {
    const { data } = await httpClient.post<AuthResponse>('/api/auth/refresh', { refreshToken });
    tokenStorage.setAccessToken(data.accessToken);
    tokenStorage.setRefreshToken(data.refreshToken);
    return data;
  },
  logout: () => tokenStorage.clear(),
};
