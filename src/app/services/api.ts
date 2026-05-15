import { COOKIE_SESSION_TOKEN } from '../lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getToken() {
  const token = localStorage.getItem('token');
  if (USE_BACKEND && token?.startsWith('mock-jwt-token')) return null;
  return token === COOKIE_SESSION_TOKEN ? null : token;
}

function normalizeEndpoint(endpoint: string) {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

function shouldAttachToken(endpoint: string) {
  const pathname = endpoint.replace(API_BASE_URL, '');
  return ![

    '/auth/login',
    '/auth/register',
    '/auth/signup',
    '/auth/register/verify-otp',
    '/auth/verify-email',
    '/auth/verify-registration',
    '/auth/verify-otp',
  ].some((authEndpoint) => pathname.endsWith(authEndpoint));
}

async function parseResponse(response: Response) {
  if (response.status === 204) return undefined;

  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getHeaderToken(response: Response) {
  const authorization = response.headers.get('authorization');
  const directToken = response.headers.get('x-auth-token') || response.headers.get('x-access-token');
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  return bearerToken || directToken || '';
}

function withHeaderToken(data: unknown, token: string) {
  if (!token) return data;

  if (!data) {
    return { token };
  }

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return { ...(data as Record<string, unknown>), token };
  }

  return data;
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!USE_BACKEND) {
    throw new ApiError('Backend disabled by VITE_USE_BACKEND', 0);
  }

  const token = shouldAttachToken(endpoint) ? getToken() : null;
  const isFormData = options.body instanceof FormData;
  const headers: HeadersInit = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response: Response;
  try {
    response = await fetch(normalizeEndpoint(endpoint), {
      ...options,
      headers,
      credentials: options.credentials || 'include',
    });
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Unable to reach backend API', 0, error);
  }
  const data = await parseResponse(response);

  if (!response.ok) {
    let message = `API error: ${response.status}`;
    if (data && typeof data === 'object' && 'message' in data) {
      message = String((data as { message?: unknown }).message || message);
    } else if (typeof data === 'string') {
      message = data;
    }

    throw new ApiError(message, response.status, data);
  }

  return withHeaderToken(data, getHeaderToken(response)) as T;
}

export async function apiRequestAny<T>(
  endpoints: string[],
  options: RequestInit | ((endpoint: string) => RequestInit) = {},
): Promise<T> {
  let lastError: unknown;

  for (const endpoint of endpoints) {
    try {
      const nextOptions = typeof options === 'function' ? options(endpoint) : options;
      return await apiRequest<T>(endpoint, nextOptions);
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && error.status !== 404 && error.status !== 405) {
        throw error;
      }
    }
  }

  throw lastError;
}

function unwrapApiData<T>(value: unknown, keys: string[] = []): T {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of keys) {
      if (key in record) return record[key] as T;
    }
    if ('data' in record) {
      const data = record.data;
      if (data && typeof data === 'object') {
        const dataRecord = data as Record<string, unknown>;
        for (const key of keys) {
          if (key in dataRecord) return dataRecord[key] as T;
        }
      }
      return data as T;
    }
    if ('result' in record) return record.result as T;
  }

  return value as T;
}

export { API_BASE_URL, USE_BACKEND, unwrapApiData };
