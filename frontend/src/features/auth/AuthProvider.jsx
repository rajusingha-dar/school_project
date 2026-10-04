import { useCallback, useEffect, useMemo, useState } from 'react';
import * as authApi from '../../api/auth';
import { setAuthFailureHandler } from '../../api/client';
import { AuthContext } from './AuthContext';

/** Provides the current user and auth actions; restores the session on first load. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'authenticated' | 'anonymous'

  useEffect(() => {
    let cancelled = false;
    setAuthFailureHandler(() => {
      setUser(null);
      setStatus('anonymous');
    });
    authApi
      .restoreSession()
      .then((restoredUser) => {
        if (cancelled) return;
        setUser(restoredUser);
        setStatus(restoredUser ? 'authenticated' : 'anonymous');
      })
      .catch(() => {
        if (!cancelled) setStatus('anonymous');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const signedInUser = await authApi.login(email, password);
    setUser(signedInUser);
    setStatus('authenticated');
    return signedInUser;
  }, []);

  const register = useCallback(async (fullName, email, password) => {
    const newUser = await authApi.register(fullName, email, password);
    setUser(newUser);
    setStatus('authenticated');
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
