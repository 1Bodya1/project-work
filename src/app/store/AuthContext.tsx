import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { isAdminUser } from '../lib/auth';
import type { TwoFactorSetup, VerifyRegisterOtpData, OtpChallenge } from '../services/authService';
import type { User } from '../types';

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  password: string;
  phone?: string;
};

type UpdateProfileData = {
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  city?: User['city'];
  novaPoshtaWarehouse?: User['novaPoshtaWarehouse'];
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (data: LoginData) => Promise<User>;
  register: (data: RegisterData) => Promise<User | OtpChallenge>;
  verifyRegisterOtp: (data: VerifyRegisterOtpData) => Promise<User>;
  logout: () => Promise<void>;
  loadMe: () => Promise<User | null>;
  updateProfile: (data: UpdateProfileData) => Promise<User>;
  setupTwoFactor: () => Promise<TwoFactorSetup>;
  enableTwoFactor: (otp: string) => Promise<User>;
  disableTwoFactor: (otp?: string) => Promise<User>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredUser() {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  async function loadMe() {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      setAuthError(null);
      return null;
    }

    try {
      setAuthError(null);
      const currentUser = await authService.getMe();
      const currentToken = localStorage.getItem('token');
      setToken(currentUser ? currentToken : null);
      setUser(currentUser);
      setIsLoading(false);
      return currentUser;
    } catch (error) {
      // authService.getMe() handles 401 by clearing session, so if it throws, show error
      console.error('Failed to load user:', error);
      setAuthError(error instanceof Error ? error.message : 'Failed to load user session');
      setIsLoading(false);
      return null;
    }
  }

  async function login(data: LoginData) {
    try {
      setAuthError(null);
      const response = await authService.login(data);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Login failed';
      setAuthError(errorMsg);
      throw error;
    }
  }

  async function register(data: RegisterData) {
    try {
      setAuthError(null);
      const response = await authService.register(data);
      if ('otpRequired' in response) {
        return response;
      }

      setToken(response.token);
      setUser(response.user);
      return response.user;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Registration failed';
      setAuthError(errorMsg);
      throw error;
    }
  }

  async function verifyRegisterOtp(data: VerifyRegisterOtpData) {
    try {
      setAuthError(null);
      const response = await authService.verifyRegisterOtp(data);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Registration verification failed';
      setAuthError(errorMsg);
      throw error;
    }
  }

  async function logout() {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      setAuthError(null);
    }
  }

  async function updateProfile(data: UpdateProfileData) {
    try {
      setAuthError(null);
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update profile';
      setAuthError(errorMsg);
      throw error;
    }
  }

  async function setupTwoFactor() {
    try {
      setAuthError(null);
      return await authService.setupTwoFactor();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to start 2FA setup';
      setAuthError(errorMsg);
      throw error;
    }
  }

  async function enableTwoFactor(otp: string) {
    try {
      setAuthError(null);
      const updatedUser = await authService.enableTwoFactor({ otp });
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to enable 2FA';
      setAuthError(errorMsg);
      throw error;
    }
  }

  async function disableTwoFactor(otp = '') {
    try {
      setAuthError(null);
      const updatedUser = await authService.disableTwoFactor({ otp });
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to disable 2FA';
      setAuthError(errorMsg);
      throw error;
    }
  }

  useEffect(() => {
    function handleUnauthorized() {
      // Real invalid token - clear session
      setToken(null);
      setUser(null);
      setAuthError('Session expired. Please login again.');
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    loadMe();

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isAdmin: isAdminUser(user),
      isLoading,
      authError,
      login,
      register,
      verifyRegisterOtp,
      logout,
      loadMe,
      updateProfile,
      setupTwoFactor,
      enableTwoFactor,
      disableTwoFactor,
    }),
    [isLoading, token, user, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
