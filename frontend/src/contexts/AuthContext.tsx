import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/authApi';
import type { AuthCredentials, CulturalUser, RegistrationDetails } from '../types/user';

interface AuthValue {
  user: CulturalUser | null;
  isAuthenticated: boolean;
  pending: boolean;
  error: string | null;
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (details: RegistrationDetails) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<CulturalUser>) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({
  children
}: {children: React.ReactNode;}) {
  const [user, setUser] = useState<CulturalUser | null>(null);
  const [pending, setPending] = useState(() => !sessionStorage.getItem('viranikosh.signedOut'));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem('viranikosh.signedOut')) return;
    setPending(true);
    authApi.getMe()
      .then((u) => setUser(u))
      .catch(() => { /* cookie expired or invalid — stay logged out */ })
      .finally(() => setPending(false));
  }, []);

  const login = useCallback(async (credentials: AuthCredentials) => {
    setPending(true);
    setError(null);
    try {
      const result = await authApi.login(credentials);
      sessionStorage.removeItem('viranikosh.signedOut');
      setUser(result.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in');
      throw e;
    } finally {
      setPending(false);
    }
  }, []);

  const register = useCallback(async (details: RegistrationDetails) => {
    setPending(true);
    setError(null);
    try {
      const result = await authApi.register(details);
      sessionStorage.removeItem('viranikosh.signedOut');
      setUser(result.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create your account');
      throw e;
    } finally {
      setPending(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    sessionStorage.setItem('viranikosh.signedOut', '1');
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<CulturalUser>) => {
    setUser((prev) => prev ? { ...prev, ...patch } : prev);
  }, []);

  const value = useMemo<AuthValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    pending,
    error,
    login,
    register,
    logout,
    updateUser,
    clearError: () => setError(null)
  }), [user, pending, error, login, register, logout, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
