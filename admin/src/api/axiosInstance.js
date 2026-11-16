import axios from 'axios';

export const TOKEN_KEY = 'jishya_admin_token';
export const SESSION_EXPIRED_KEY = 'jishya_admin_session_expired';

export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

// localStorage can throw (private mode, blocked storage) — never let that crash the app.
export function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function writeToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    /* ignore */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    /* ignore */
  }
}

/** Turns "/uploads/gallery/x.jpg" into an absolute URL on the backend. */
export function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Pulls the most useful message out of an Axios error. */
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err && err.response) {
    const data = err.response.data;
    if (data && Array.isArray(data.details) && data.details.length > 0) {
      return data.details.map((d) => d.message).join(' · ');
    }
    if (data && data.error) return data.error;
    return fallback;
  }
  if (err && err.request) return 'Cannot reach the server. Check your connection and try again.';
  return fallback;
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Attach the Bearer token to every request.
api.interceptors.request.use((config) => {
  const token = readToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 anywhere (except a failed login attempt) means the session is over.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response && error.response.status;
    const url = (error.config && error.config.url) || '';
    const isLoginRequest = url.includes('/api/auth/login');

    if (status === 401 && !isLoginRequest) {
      clearToken();
      try {
        sessionStorage.setItem(SESSION_EXPIRED_KEY, '1');
      } catch (e) {
        /* ignore */
      }
      const loginPath = `${import.meta.env.BASE_URL}login`;
      if (window.location.pathname !== loginPath) {
        window.location.replace(loginPath);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
