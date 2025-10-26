import {createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode} from 'react';

import {fetchAuthConfig, fetchCurrentUser, login as loginRequest, logout as logoutRequest, register as registerRequest} from '../api/auth';
import type {AuthUser} from '../types/api';
import {useSnackbar} from './SnackbarProvider';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  allowRegistration: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setAllowRegistration: (allow: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [allowRegistration, setAllowRegistrationState] = useState(true);
  const [loading, setLoading] = useState(true);
  const snackbar = useSnackbar();

  const initialize = useCallback(async () => {
    setLoading(true);
    try {
      const [config, authUser] = await Promise.all([fetchAuthConfig(), fetchCurrentUser()]);
      setAllowRegistrationState(config.allowRegistration);
      setUser(authUser);
    } catch (error) {
      snackbar.showMessage('Unable to load authentication status', 'error');
    } finally {
      setLoading(false);
    }
  }, [snackbar]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const login = useCallback(
    async (email: string, password: string) => {
      const loggedIn = await loginRequest(email, password);
      setUser(loggedIn);
      snackbar.showMessage('Logged in successfully', 'success');
    },
    [snackbar]
  );

  const register = useCallback(
    async (email: string, password: string, firstName: string, lastName: string) => {
      const registered = await registerRequest(email, password, firstName, lastName);
      setUser(registered);
      snackbar.showMessage('Registration successful', 'success');
    },
    [snackbar]
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    snackbar.showMessage('Logged out', 'info');
  }, [snackbar]);

  const refreshUser = useCallback(async () => {
    const current = await fetchCurrentUser();
    setUser(current);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      allowRegistration,
      login,
      register,
      logout,
      refreshUser,
      setAllowRegistration: setAllowRegistrationState
    }),
    [user, loading, allowRegistration, login, register, logout, refreshUser, setAllowRegistrationState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
