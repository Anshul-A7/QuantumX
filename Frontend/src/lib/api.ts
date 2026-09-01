import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// ============================================================================
// QUANTUMX — ENTERPRISE API INTEGRATION LAYER
// ============================================================================
// Production Axios client with JWT session management, automatic 7-day sliding
// refresh on 401, HTTPOnly cookie credentials, and seamless queue replay.
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const TIMEOUT_MS = 60000;

// Token storage keys
export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'quantumx_access_token',
  REFRESH_TOKEN: 'quantumx_refresh_token',
  USER_DATA: 'quantumx_user_data',
  USER_EMAIL: 'quantumx_user_email',
  USER_NAME: 'quantumx_user_name',
  USER_AVATAR: 'quantumx_user_avatar',
} as const;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT_MS,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ----------------------------------------------------------------------------
// Token utility functions
// ----------------------------------------------------------------------------

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  if (accessToken) localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
  if (refreshToken) localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
}

export function setUserData(user: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(user));
  if (user.email && typeof user.email === 'string') {
    localStorage.setItem(TOKEN_KEYS.USER_EMAIL, user.email);
  }
  if (user.username && typeof user.username === 'string') {
    localStorage.setItem(TOKEN_KEYS.USER_NAME, user.username);
  }
  if (user.profileImageUrl && typeof user.profileImageUrl === 'string') {
    localStorage.setItem(TOKEN_KEYS.USER_AVATAR, user.profileImageUrl);
  }
}

export function getUserData(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TOKEN_KEYS.USER_DATA);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.USER_DATA);
  localStorage.removeItem(TOKEN_KEYS.USER_EMAIL);
  localStorage.removeItem(TOKEN_KEYS.USER_NAME);
  localStorage.removeItem(TOKEN_KEYS.USER_AVATAR);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken() || !!getRefreshToken();
}

// ----------------------------------------------------------------------------
// Request Interceptor: Inject Authorization Header
// ----------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ----------------------------------------------------------------------------
// Response Interceptor: Auto-refresh JWT on 401, Global Error Handling
// ----------------------------------------------------------------------------
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized — attempt token refresh with sliding window
    if (error.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url || '';
      if (url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/verify-email')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken: refreshToken || undefined },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              ...(refreshToken ? { Authorization: `Bearer ${refreshToken}` } : {}),
            },
          }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken, user } = response.data;
        setTokens(newAccessToken, newRefreshToken || refreshToken || '');
        if (user) {
          setUserData(user);
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        clearAuth();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register') && !window.location.pathname.startsWith('/verify-email')) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ----------------------------------------------------------------------------
// Silent Session Initializer (Bootstrap)
// ----------------------------------------------------------------------------
export async function initAuthSession(): Promise<Record<string, unknown> | null> {
  if (typeof window === 'undefined') return null;

  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  // If no tokens exist, return null
  if (!accessToken && !refreshToken) {
    return null;
  }

  try {
    // Attempt to fetch current user profile with active token
    if (accessToken) {
      const profileRes = await apiClient.get('/auth/me');
      setUserData(profileRes.data);
      return profileRes.data;
    }
  } catch (err) {
    // If access token failed, try silent refresh
  }

  if (refreshToken) {
    try {
      const refreshRes = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { withCredentials: true }
      );
      const { accessToken: newAccessToken, refreshToken: newRefreshToken, user } = refreshRes.data;
      setTokens(newAccessToken, newRefreshToken || refreshToken);
      if (user) {
        setUserData(user);
      }
      return user;
    } catch {
      clearAuth();
      return null;
    }
  }

  return null;
}

