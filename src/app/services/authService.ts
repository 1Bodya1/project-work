import { apiRequest, apiRequestAny, ApiError, USE_BACKEND } from './api';
import { isAdminEmail, normalizeEmail } from '../lib/auth';
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

type AuthResponse = {
  token: string;
  user: User;
};

export type OtpChallenge = {
  otpRequired: true;
  challengeId?: string;
  email?: string;
  expiresAt?: string;
};

export type RegisterResult = AuthResponse | OtpChallenge;

type VerifyOtpData = {
  challengeId?: string;
  email?: string;
  otp: string;
};

export type VerifyRegisterOtpData = VerifyOtpData;

export type TwoFactorSetup = {
  secret?: string;
  otpauthUrl?: string;
  qrCodeUrl?: string;
  backupCodes?: string[];
};

type TwoFactorActionData = {
  otp: string;
};

function saveSession(token: string, user: User) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth:unauthorized'));
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

function getStoredUser(): User | null {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

function getMockRole(email: string): User['role'] {
  const normalizedEmail = normalizeEmail(email);
  return normalizedEmail === 'admin@example.com' || normalizedEmail.includes('admin') || isAdminEmail(normalizedEmail)
    ? 'admin'
    : 'user';
}

function getMockTwoFactorKey(email: string) {
  return `mock:2fa:${email.toLowerCase()}`;
}

function isMockTwoFactorEnabled(email: string) {
  return localStorage.getItem(getMockTwoFactorKey(email)) === 'true';
}

function createMockUser(email: string, firstName?: string, lastName?: string, name?: string, phone?: string): User {
  const first = firstName || name?.split(' ')[0] || email.split('@')[0];
  const last = lastName || name?.split(' ').slice(1).join(' ') || 'User';
  return {
    id: 'mock-' + Date.now(),
    email,
    firstName: first,
    lastName: last,
    name: name || `${first} ${last}`.trim(),
    phone,
    role: getMockRole(email),
    twoFactorEnabled: isMockTwoFactorEnabled(email),
  };
}

function normalizeRole(value: unknown): User['role'] {
  const role = String(value || 'user').trim().toLowerCase();
  return role === 'admin' || role === 'administrator' ? 'admin' : 'user';
}

/**
 * Normalize various backend auth response shapes to standard format
 */
function toRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? value as Record<string, unknown> : undefined;
}

function firstString(...values: unknown[]) {
  const value = values.find((candidate) => typeof candidate === 'string' && candidate.trim());
  return value ? String(value) : '';
}

function extractToken(value: unknown, depth = 0): string {
  if (typeof value === 'string') {
    return depth === 0 ? value : '';
  }

  const record = toRecord(value);
  if (!record || depth > 4) return '';

  const directToken = firstString(
    record.accessToken,
    record.access_token,
    record.authToken,
    record.auth_token,
    record.jwtToken,
    record.jwt_token,
    record.jwt,
    record.bearerToken,
    record.bearer_token,
    record.bearer,
    record.token,
    record.access,
  );
  if (directToken) return directToken;

  for (const key of ['data', 'result', 'auth', 'session', 'tokens', 'payload', 'jwt']) {
    const nestedToken = extractToken(record[key], depth + 1);
    if (nestedToken) return nestedToken;
  }

  return '';
}

function hasUserShape(value: Record<string, unknown>) {
  return Boolean(
    value.id
    || value._id
    || value.email
    || value.firstName
    || value.first_name
    || value.lastName
    || value.last_name
    || value.name
    || value.fullName
    || value.full_name
    || value.role
    || value.phone
  );
}

function normalizeAuthResponse(response: unknown): { token?: string; user?: User } {
  const record = response && typeof response === 'object' ? response as Record<string, unknown> : {};
  const data = record.data && typeof record.data === 'object'
    ? record.data as Record<string, unknown>
    : undefined;
  
  // Try various token keys
  const token = extractToken(response);
  
  // Try various user keys and structures
  const explicitUser = toRecord(record.user)
    || toRecord(record.currentUser)
    || toRecord(record.profile)
    || toRecord(data?.user)
    || toRecord(data?.currentUser)
    || toRecord(data?.profile);
  const user = explicitUser
    || (data && hasUserShape(data) ? data : undefined)
    || (hasUserShape(record) ? record : undefined);
  
  return { 
    token: token || undefined, 
    user: user ? normalizeUser(user) : undefined,
  };
}

function normalizeOtpChallenge(response: unknown): OtpChallenge | null {
  const record = response && typeof response === 'object' ? response as Record<string, unknown> : {};
  const data = record.data && typeof record.data === 'object'
    ? record.data as Record<string, unknown>
    : {};
  const source = { ...record, ...data };
  const message = String(source.message || source.detail || source.status || '').toLowerCase();
  const otpRequired = Boolean(
    source.otpRequired
      || source.otp_required
      || source.verificationRequired
      || source.verification_required
      || source.emailVerificationRequired
      || source.email_verification_required
      || source.requiresOtp
      || source.twoFactorRequired
      || (message && (message.includes('otp') || message.includes('verification') || message.includes('verify') || message.includes('code')))
  );

  if (!otpRequired) return null;

  const challengeId = source.challengeId
    || source.challenge_id
    || source.verificationId
    || source.verification_id
    || source.tempToken
    || source.otpToken;

  return {
    otpRequired: true,
    challengeId: challengeId ? String(challengeId) : undefined,
    email: source.email ? String(source.email) : undefined,
    expiresAt: source.expiresAt ? String(source.expiresAt) : undefined,
  };
}

function createRegistrationOtpChallenge(response: unknown, email: string): OtpChallenge {
  const challenge = normalizeOtpChallenge(response);
  return {
    otpRequired: true,
    challengeId: challenge?.challengeId,
    email: challenge?.email || email,
    expiresAt: challenge?.expiresAt,
  };
}

function isAuthFailure(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = atob(padded);
    const json = decodeURIComponent(
      Array.from(decoded, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeJwtUser(token: string): User | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const user = normalizeUser({
    ...payload,
    id: payload.id || payload._id || payload.sub,
  });

  return user.email || user.id ? user : null;
}

function normalizeTwoFactorSetup(response: unknown): TwoFactorSetup {
  const record = response && typeof response === 'object' ? response as Record<string, unknown> : {};
  const data = record.data && typeof record.data === 'object'
    ? record.data as Record<string, unknown>
    : {};
  const source = { ...record, ...data };
  const backupCodes = source.backupCodes || source.backup_codes;

  return {
    secret: source.secret ? String(source.secret) : undefined,
    otpauthUrl: source.otpauthUrl || source.otpauth_url || source.uri
      ? String(source.otpauthUrl || source.otpauth_url || source.uri)
      : undefined,
    qrCodeUrl: source.qrCodeUrl || source.qrCode || source.qr_code_url
      ? String(source.qrCodeUrl || source.qrCode || source.qr_code_url)
      : undefined,
    backupCodes: Array.isArray(backupCodes) ? backupCodes.map(String) : undefined,
  };
}

/**
 * Normalize various user object shapes
 */
function normalizeUser(user: Record<string, unknown>): User {
  const email = normalizeEmail(user.email);
  const city = user.city && typeof user.city === 'object'
    ? {
        ref: String((user.city as Record<string, unknown>).ref || ''),
        description: String((user.city as Record<string, unknown>).description || ''),
      }
    : user.city
      ? {
          ref: undefined,
          description: String(user.city),
        }
      : undefined;

  return {
    id: String(user.id || user._id || ''),
    firstName: String(user.firstName || user.first_name || user.firstName || ''),
    lastName: String(user.lastName || user.last_name || user.lastName || ''),
    name: String(user.name || user.fullName || user.full_name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || ''),
    email,
    phone: user.phone ? String(user.phone) : undefined,
    role: isAdminEmail(email) ? 'admin' : normalizeRole(user.role),
    twoFactorEnabled: Boolean(user.twoFactorEnabled || user.two_factor_enabled || user.isTwoFactorEnabled),
    city,
    novaPoshtaWarehouse: user.novaPoshtaWarehouse && typeof user.novaPoshtaWarehouse === 'object'
      ? {
          ref: String((user.novaPoshtaWarehouse as Record<string, unknown>).ref || ''),
          description: String((user.novaPoshtaWarehouse as Record<string, unknown>).description || ''),
          shortAddress: String(
            (user.novaPoshtaWarehouse as Record<string, unknown>).shortAddress
            || (user.novaPoshtaWarehouse as Record<string, unknown>).address
            || '',
          ),
          number: String((user.novaPoshtaWarehouse as Record<string, unknown>).number || ''),
        }
      : undefined,
  };
}

function normalizeUserResponse(response: unknown): User {
  const record = response && typeof response === 'object' ? response as Record<string, unknown> : {};
  const data = record.data && typeof record.data === 'object'
    ? record.data as Record<string, unknown>
    : undefined;
  const user = record.user || data?.user || data || record;

  return normalizeUser(user as Record<string, unknown>);
}

async function fetchCurrentUser() {
  const response = await apiRequestAny<unknown>([
    '/auth/me',
    '/users/me',
  ]);
  const user = normalizeUserResponse(response);

  if (!user.email && !user.id) {
    throw new Error('Invalid auth response: missing user data');
  }

  return user;
}

async function completeAuthResponse(response: unknown): Promise<AuthResponse> {
  const { token, user } = normalizeAuthResponse(response);

  if (!token) {
    throw new Error('Invalid auth response: missing JWT token');
  }

  if (token && (user?.email || user?.id)) {
    saveSession(token, user);
    return { token, user };
  }

  localStorage.setItem('token', token);

  try {
    const currentUser = await fetchCurrentUser();
    saveSession(token, currentUser);
    return { token, user: currentUser };
  } catch (error) {
    const jwtUser = normalizeJwtUser(token);
    if (jwtUser) {
      saveSession(token, jwtUser);
      return { token, user: jwtUser };
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    if (isAuthFailure(error) && token) {
      throw new Error('Invalid auth response: token was rejected while loading user data');
    }

    throw new Error('Invalid auth response: missing token or user data');
  }
}

export const authService = {
  async login(data: LoginData) {
    try {
      const response = await apiRequest<unknown>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return await completeAuthResponse(response);
    } catch (error) {
      // Only fallback to mock if backend is disabled
      if (!USE_BACKEND) {
        console.warn('Backend disabled, using mock auth');
        const mockUser = createMockUser(data.email);
        const token = 'mock-jwt-token-' + Date.now();
        saveSession(token, mockUser);
        return { token, user: mockUser };
      }
      
      // If backend is enabled but fails, throw the error - don't silently create mock user
      console.error('Login failed:', error);
      throw error;
    }
  },

  async register(data: RegisterData): Promise<RegisterResult> {
    try {
      const response = await apiRequest<unknown>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const challenge = normalizeOtpChallenge(response);
      if (challenge) {
        return {
          ...challenge,
          email: challenge.email || data.email,
        };
      }

      const authResponse = normalizeAuthResponse(response);
      if (!authResponse.token) {
        return createRegistrationOtpChallenge(response, data.email);
      }

      return await completeAuthResponse(response);
    } catch (error) {
      if (error instanceof ApiError) {
        const challenge = normalizeOtpChallenge(error.data);
        if (challenge) {
          return {
            ...challenge,
            email: challenge.email || data.email,
          };
        }
      }

      // Only fallback to mock if backend is disabled
      if (!USE_BACKEND) {
        console.warn('Backend disabled, using mock auth');
        const challengeId = 'mock-signup-otp-' + Date.now();
        sessionStorage.setItem(`mock:signup:challenge:${challengeId}`, JSON.stringify(data));
        return { otpRequired: true, challengeId, email: data.email } satisfies OtpChallenge;
      }
      
      // If backend is enabled but fails, throw the error - don't silently create mock user
      console.error('Registration failed:', error);
      throw error;
    }
  },

  async verifyRegisterOtp(data: VerifyRegisterOtpData) {
    try {
      const response = await apiRequestAny<unknown>([
        '/auth/register/verify-otp',
        '/auth/verify-email',
        '/auth/verify-registration',
        '/auth/verify-otp',
      ], {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return await completeAuthResponse(response);
    } catch (error) {
      if (!USE_BACKEND) {
        if (data.otp !== '123456') {
          throw new Error('Invalid verification code');
        }

        const pendingRegistration = data.challengeId
          ? sessionStorage.getItem(`mock:signup:challenge:${data.challengeId}`)
          : null;
        const registrationData = pendingRegistration
          ? JSON.parse(pendingRegistration) as RegisterData
          : undefined;
        const email = registrationData?.email || data.email || 'mock@example.com';
        const mockUser = createMockUser(
          email,
          registrationData?.firstName,
          registrationData?.lastName,
          registrationData?.name,
          registrationData?.phone,
        );
        const token = 'mock-jwt-token-' + Date.now();
        if (data.challengeId) {
          sessionStorage.removeItem(`mock:signup:challenge:${data.challengeId}`);
        }
        saveSession(token, mockUser);
        return { token, user: mockUser };
      }

      console.error('Registration OTP verification failed:', error);
      throw error;
    }
  },

  async getMe() {
    const token = getToken();
    if (!token) {
      // No token, return stored user or null
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    }

    try {
      const user = await fetchCurrentUser();
      // Update stored user to keep in sync with backend
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      // If 401 from /auth/me, it's a real invalid token - clear session
      if (isAuthFailure(error)) {
        console.error('Token is invalid/expired, clearing session');
        clearSession();
        return null;
      }
      
      // For other errors (backend down, network issues), return stored user as fallback
      console.error('Failed to fetch user from backend:', error);
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    }
  },

  async updateProfile(data: UpdateProfileData) {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      // Try /auth/profile first (preferred endpoint)
      const user = await apiRequest<unknown>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      const normalized = normalizeUserResponse(user);
      saveSession(token, normalized);
      return normalized;
    } catch (error) {
      if (isAuthFailure(error)) {
        clearSession();
        throw error;
      }

      // If /auth/profile fails, try /users/me as fallback
      try {
        const user = await apiRequest<unknown>('/users/me', {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
        const normalized = normalizeUserResponse(user);
        saveSession(token, normalized);
        return normalized;
      } catch (fallbackError) {
        if (isAuthFailure(fallbackError)) {
          clearSession();
          throw fallbackError;
        }

        console.error('Failed to update profile on both endpoints:', error, fallbackError);
        const storedUser = localStorage.getItem('user');
        if (!storedUser) throw fallbackError;

        const user = JSON.parse(storedUser) as User;
        const updatedUser = {
          ...user,
          ...data,
          name: data.name || `${data.firstName || user.firstName || ''} ${data.lastName || user.lastName || ''}`.trim() || user.name,
        };
        saveSession(token, updatedUser);
        return updatedUser;
      }
    }
  },

  async setupTwoFactor() {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await apiRequestAny<unknown>([
        '/auth/2fa/setup',
        '/auth/two-factor/setup',
      ], { method: 'POST' });

      return normalizeTwoFactorSetup(response);
    } catch (error) {
      if (!USE_BACKEND) {
        const user = getStoredUser();
        const label = encodeURIComponent(user?.email || 'mock@example.com');
        const secret = 'JBSWY3DPEHPK3PXP';

        return {
          secret,
          otpauthUrl: `otpauth://totp/Solution:${label}?secret=${secret}&issuer=Solution`,
        };
      }

      console.error('Failed to start 2FA setup:', error);
      throw error;
    }
  },

  async enableTwoFactor(data: TwoFactorActionData) {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await apiRequestAny<unknown>([
        '/auth/2fa/enable',
        '/auth/two-factor/enable',
      ], {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const user = normalizeUserResponse(response);
      const storedUser = getStoredUser();
      const updatedUser = user.email ? user : { ...storedUser, twoFactorEnabled: true } as User;
      saveSession(token, updatedUser);
      return updatedUser;
    } catch (error) {
      if (!USE_BACKEND) {
        if (data.otp !== '123456') {
          throw new Error('Invalid verification code');
        }

        const user = getStoredUser();
        if (!user) throw new Error('Not authenticated');

        const updatedUser = { ...user, twoFactorEnabled: true };
        localStorage.setItem(getMockTwoFactorKey(user.email), 'true');
        saveSession(token, updatedUser);
        return updatedUser;
      }

      console.error('Failed to enable 2FA:', error);
      throw error;
    }
  },

  async disableTwoFactor(data: Partial<TwoFactorActionData> = {}) {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await apiRequestAny<unknown>([
        '/auth/2fa/disable',
        '/auth/two-factor/disable',
      ], {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const user = normalizeUserResponse(response);
      const storedUser = getStoredUser();
      const updatedUser = user.email ? user : { ...storedUser, twoFactorEnabled: false } as User;
      saveSession(token, updatedUser);
      return updatedUser;
    } catch (error) {
      if (!USE_BACKEND) {
        const user = getStoredUser();
        if (!user) throw new Error('Not authenticated');

        const updatedUser = { ...user, twoFactorEnabled: false };
        localStorage.removeItem(getMockTwoFactorKey(user.email));
        saveSession(token, updatedUser);
        return updatedUser;
      }

      console.error('Failed to disable 2FA:', error);
      throw error;
    }
  },

  async logout() {
    try {
      const token = getToken();
      if (token) {
        // Call backend logout (stateless, but good practice)
        await apiRequest('/auth/logout', { method: 'POST' }).catch((e) => console.error('Backend logout failed:', e));
      }
    } finally {
      // Always clear local session, even if backend request fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    return { success: true };
  },

  isAuthenticated(): boolean {
    return !!getToken();
  },

  getToken,
};
