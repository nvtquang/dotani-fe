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
  /** Revokes the refresh token on the server (every session with allDevices), then forgets the tokens locally. */
  logout: async (allDevices = false) => {
    const refreshToken = tokenStorage.getRefreshToken();
    tokenStorage.clear();
    if (refreshToken) {
      try {
        await httpClient.post('/api/auth/logout', { refreshToken, allDevices });
      } catch {
        // signing out locally must not depend on the server being reachable
      }
    }
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const { data } = await httpClient.put<AuthResponse>('/api/auth/password', { currentPassword, newPassword });
    tokenStorage.setAccessToken(data.accessToken);
    tokenStorage.setRefreshToken(data.refreshToken);
    return data;
  },
  forgotPassword: async (email: string) => {
    await httpClient.post('/api/auth/password/forgot', { email });
  },
  resetPassword: async (token: string, newPassword: string) => {
    await httpClient.post('/api/auth/password/reset', { token, newPassword });
  },
};
