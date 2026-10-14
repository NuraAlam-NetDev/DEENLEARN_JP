import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthContext } from './authContext.js';
import * as authService from '../services/authService.js';
import { setSessionExpiredHandler } from '../services/api.js';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until the first /auth/me answers
  const started = useRef(false);

  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));

    if (started.current) return; // StrictMode runs effects twice in dev
    started.current = true;

    authService
      .me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  // After the profile is edited the server returns the fresh user; keep the UI in sync
  const updateUser = useCallback((next) => setUser(next), []);

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: !!user, login, register, logout, updateUser }),
    [user, loading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
