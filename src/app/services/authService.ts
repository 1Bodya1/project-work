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

const mockUser: User = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+380501234567',
  role: 'user',
};

function getMockRole(email: string): User['role'] {
  const normalizedEmail = email.toLowerCase();
  return normalizedEmail === 'admin@solution.com' || normalizedEmail.includes('admin')
    ? 'admin'
    : 'user';
}

function saveSession(token: string, user: User) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export const authService = {
  async login(data: LoginData) {
    const token = 'mock-jwt-token';
    const user = {
      ...mockUser,
      email: data.email || mockUser.email,
      role: getMockRole(data.email || mockUser.email),
    };

    saveSession(token, user);
    return { token, user };
  },

  async register(data: RegisterData) {
    const token = 'mock-jwt-token';
    const user = {
      ...mockUser,
      firstName: data.firstName || data.name?.split(' ')[0] || mockUser.firstName,
      lastName: data.lastName || data.name?.split(' ').slice(1).join(' ') || mockUser.lastName,
      name: data.name || mockUser.name,
      email: data.email,
      phone: data.phone,
      role: getMockRole(data.email),
    };

    saveSession(token, user);
    return {
      token,
      user,
    };
  },

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
  },

  async getMe() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser) as User;
    }

    return null;
  },
};
