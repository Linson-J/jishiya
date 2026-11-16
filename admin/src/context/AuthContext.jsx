import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { clearToken, readToken, writeToken } from '../api/axiosInstance';

const AuthContext = createContext(null);

/** Decodes the payload of a JWT (no signature check — the server does that). */
function decodeToken(token) {
  try {
    const part = token.split('.')[1];
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch (e) {
    return null;
  }
}

function isTokenValid(token) {
  if (!token) return false;
  const payload = decodeToken(token);
  return Boolean(payload && typeof payload.exp === 'number' && payload.exp * 1000 > Date.now());
}

// Runs once on app load: an expired or malformed stored token is discarded immediately.
function getInitialToken() {
  const stored = readToken();
  if (stored && isTokenValid(stored)) return stored;
  if (stored) clearToken();
  return null;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getInitialToken);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    if (!data || !isTokenValid(data.token)) {
      throw new Error('The server returned an invalid session token.');
    }
    writeToken(data.token);
    setToken(data.token);
  }, []);

  // Log out automatically at the moment the token expires, and re-check when the tab regains focus.
  useEffect(() => {
    if (!token) return undefined;
    const payload = decodeToken(token);
    const msLeft = payload.exp * 1000 - Date.now();
    const timer = setTimeout(logout, Math.max(msLeft, 0));

    const recheck = () => {
      if (document.visibilityState === 'visible' && !isTokenValid(token)) logout();
    };
    document.addEventListener('visibilitychange', recheck);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, [token, logout]);

  const value = useMemo(() => {
    const payload = token ? decodeToken(token) : null;
    return {
      token,
      user: payload ? { id: payload.id, email: payload.email } : null,
      isAuthenticated: isTokenValid(token),
      login,
      logout,
    };
  }, [token, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
