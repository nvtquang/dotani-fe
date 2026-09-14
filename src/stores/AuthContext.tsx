import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authService } from '../services/authService';
import { tokenStorage } from '../api/tokenStorage';
import type { AuthUser, GoogleLoginRequest, LoginRequest, RegisterRequest } from '../types/auth';

type AuthContextValue = {
  user: AuthUser | null;
  role: AuthUser['role'] | null;
  organization: {
    organizationId?: string | null;
    tdpId?: string | null;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  loginWithGoogle: (payload: GoogleLoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
  reloadMe: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(tokenStorage.getAccessToken()));

  const reloadMe = useCallback(async () => {
    if (!tokenStorage.getAccessToken()) {
      setUser(null);
      return null;
    }

    const currentUser = await authService.me();
    setUser(currentUser);
    return currentUser;
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const currentUser = await reloadMe();
        if (!mounted) {
          return;
        }
        setUser(currentUser);
      } catch {
        if (mounted) {
          authService.logout();
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [reloadMe]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      setIsLoading(true);
      try {
        await authService.login(payload);
        await reloadMe();
      } finally {
        setIsLoading(false);
      }
    },
    [reloadMe],
  );

  const register = useCallback(
    async (payload: RegisterRequest) => {
      setIsLoading(true);
      try {
        await authService.register(payload);
        await reloadMe();
      } finally {
        setIsLoading(false);
      }
    },
    [reloadMe],
  );

  const loginWithGoogle = useCallback(
    async (payload: GoogleLoginRequest) => {
      setIsLoading(true);
      try {
        await authService.loginWithGoogle(payload);
        await reloadMe();
      } finally {
        setIsLoading(false);
      }
    },
    [reloadMe],
  );

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      organization: user
        ? {
            organizationId: user.organizationId,
            tdpId: user.tdpId,
          }
        : null,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      loginWithGoogle,
      register,
      logout,
      reloadMe,
    }),
    [isLoading, login, loginWithGoogle, logout, register, reloadMe, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
