import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
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

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  loadMe: () => Promise<User | null>;
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

  async function loadMe() {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return null;
    }

    const currentUser = await authService.getMe();
    setToken(storedToken);
    setUser(currentUser);
    setIsLoading(false);
    return currentUser;
  }

  async function login(data: LoginData) {
    const response = await authService.login(data);
    setToken(response.token);
    setUser(response.user);
    return response.user;
  }

  async function register(data: RegisterData) {
    const response = await authService.register(data);
    setToken(response.token);
    setUser(response.user);
    return response.user;
  }

  async function logout() {
    await authService.logout();
    setToken(null);
    setUser(null);
  }

  useEffect(() => {
    loadMe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'admin',
      isLoading,
      login,
      register,
      logout,
      loadMe,
    }),
    [isLoading, token, user],
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
