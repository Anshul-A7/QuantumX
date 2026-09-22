import { apiClient, setTokens, setUserData, clearAuth, getRefreshToken, getAccessToken, initAuthSession } from '../lib/api';
import { isLiveRenderPlatform } from './backend-warmer.service';

// ============================================================================
// QUANTUMX — AUTHENTICATION & SESSION SERVICE
// ============================================================================

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName?: string | null;
  role: string;
  authProvider: 'LOCAL' | 'GOOGLE';
  emailVerified: boolean;
  profileImageUrl: string | null;
  createdAt: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  user: UserProfile;
  isNewUser?: boolean;
}

export interface MessageResponse {
  message: string;
  success?: boolean;
  cooldownSeconds?: number;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  message: string;
  errors?: Record<string, string>;
}

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const err = error as {
      code?: string;
      message?: string;
      request?: unknown;
      response?: {
        data?: {
          detail?: string | Array<{ msg?: string; loc?: string[] }>;
          message?: string;
          error?: string;
        };
        status?: number;
      };
    };

    const isLiveRender = isLiveRenderPlatform();

    // Cloud cold-start timeout or Gateway timeout ONLY on live Render platform
    if (
      isLiveRender &&
      (err.code === 'ECONNABORTED' ||
       err.code === 'ETIMEDOUT' ||
       err.message?.includes('timeout') ||
       err.response?.status === 504 ||
       err.response?.status === 502 ||
       err.response?.status === 503)
    ) {
      return 'The cloud server is waking up from standby. Please wait a moment and try again.';
    }

    // Standard connection failure
    if (
      err.message?.includes('Network Error') ||
      err.message?.includes('ECONNREFUSED') ||
      (!err.response && err.request)
    ) {
      return 'Unable to connect to the backend server. Please verify the server is running and try again.';
    }

    const data = err.response?.data;
    if (data) {
      if (typeof data.detail === 'string' && data.detail.trim()) {
        return data.detail;
      }
      if (Array.isArray(data.detail) && data.detail.length > 0) {
        return data.detail[0]?.msg || 'Validation failed. Please check your inputs.';
      }
      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message;
      }
      if (typeof data.error === 'string' && data.error.trim()) {
        return data.error;
      }
    }

    if (!err.response || err.response.status === 0) {
      return isLiveRender
        ? 'The cloud server is waking up from standby. Please wait a moment and try again.'
        : 'Unable to connect to the backend server. Please try again.';
    }
    if (err.response?.status === 401) {
      return 'Invalid credentials or session expired. Please sign in again.';
    }
    if (err.response?.status === 403) {
      return 'Access denied. Please check your account status.';
    }
    if (err.response?.status === 429) {
      return 'Rate limit exceeded. Please wait a moment before trying again.';
    }
    if (err.response?.status && err.response.status >= 500) {
      return 'The backend server is initializing or encountered a temporary issue. Please wait 1–2 minutes and retry.';
    }
    if (err.message) {
      if (err.message.includes('status code 400') || err.message.includes('status code 422')) {
        return 'Please check your information and try again.';
      }
      return err.message;
    }
  }
  return 'An unexpected error occurred. Please try again.';
}

export class AuthService {
  /**
   * Register a new user with email and password and authenticate immediately without OTP.
   */
  static async register(payload: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
  }): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', payload);
      if (response.data.accessToken) {
        setTokens(response.data.accessToken, response.data.refreshToken);
        setUserData(response.data.user as unknown as Record<string, unknown>);
      }
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Resend 6-digit OTP to user's email with cooldown tracking.
   */
  static async resendOtp(email: string): Promise<MessageResponse> {
    try {
      const response = await apiClient.post<MessageResponse>('/auth/resend-otp', { email });
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Verify email with OTP.
   */
  static async verifyEmail(email: string, otp: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/verify-email', { email, otp });
      const data = response.data;

      setTokens(data.accessToken, data.refreshToken);
      setUserData(data.user as unknown as Record<string, unknown>);

      return data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Authenticate with email and password (establishes 7-day sliding session).
   */
  static async login(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      const data = response.data;

      setTokens(data.accessToken, data.refreshToken);
      setUserData(data.user as unknown as Record<string, unknown>);

      return data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Authenticate with Google OAuth credential.
   */
  static async googleLogin(credential: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/google', { credential });
      const data = response.data;

      setTokens(data.accessToken, data.refreshToken);
      setUserData(data.user as unknown as Record<string, unknown>);

      return data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Manually trigger session refresh to slide the 7-day inactivity window.
   */
  static async refreshSession(): Promise<AuthResponse> {
    try {
      const refreshToken = getRefreshToken();
      const response = await apiClient.post<AuthResponse>('/auth/refresh', {
        refreshToken: refreshToken || undefined,
      });
      const data = response.data;
      setTokens(data.accessToken, data.refreshToken);
      setUserData(data.user as unknown as Record<string, unknown>);
      return data;
    } catch (error) {
      clearAuth();
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Send a password reset email.
   */
  static async forgotPassword(email: string): Promise<MessageResponse> {
    try {
      const response = await apiClient.post<MessageResponse>('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Reset password using token from reset email.
   */
  static async resetPassword(token: string, newPassword: string): Promise<MessageResponse> {
    try {
      const response = await apiClient.post<MessageResponse>('/auth/reset-password', {
        token,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Get the currently authenticated user's profile and touch active session.
   */
  static async getCurrentUser(): Promise<UserProfile> {
    try {
      const response = await apiClient.get<UserProfile>('/auth/me');
      setUserData(response.data as unknown as Record<string, unknown>);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Update the user profile on the backend and sync local storage.
   */
  static async updateProfile(payload: { fullName?: string; profileImageUrl?: string | null }): Promise<UserProfile> {
    try {
      const response = await apiClient.patch<UserProfile>('/users/me', payload);
      setUserData(response.data as unknown as Record<string, unknown>);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Logout: immediately revokes session in DB and wipes all client state and cookies.
   */
  static async logout(): Promise<void> {
    try {
      const refreshToken = getRefreshToken();
      await apiClient.post('/auth/logout', { refreshToken: refreshToken || undefined }).catch(() => {});
    } finally {
      clearAuth();
    }
  }

  /**
   * Permanently delete user account and associated clinical data.
   */
  static async deleteAccount(): Promise<void> {
    try {
      await apiClient.delete('/auth/account');
    } finally {
      clearAuth();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('quantumx_prediction_history');
        localStorage.removeItem('quantumx_notifications');
        localStorage.removeItem('quantumx_is_new_registration');
      }
    }
  }

  /**
   * Check if user has an active session token.
   */
  static isAuthenticated(): boolean {
    return !!getAccessToken() || !!getRefreshToken();
  }

  /**
   * Initialize session silently on page load.
   */
  static async bootstrapSession(): Promise<UserProfile | null> {
    const user = await initAuthSession();
    return user ? (user as unknown as UserProfile) : null;
  }

  /**
   * Get cached user data from localStorage.
   */
  static getCachedUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('quantumx_user_data');
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch {
      return null;
    }
  }
}

