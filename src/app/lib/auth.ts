import type { User } from '../types';

export const COOKIE_SESSION_TOKEN = 'cookie-session';

export const ADMIN_EMAILS = new Set(['bodyarydiak@gmail.com']);

export function normalizeEmail(email: unknown) {
  return String(email || '').trim().toLowerCase();
}

export function isAdminEmail(email: unknown) {
  return ADMIN_EMAILS.has(normalizeEmail(email));
}

export function isAdminUser(user: User | null) {
  return String(user?.role || '').toLowerCase() === 'admin' || isAdminEmail(user?.email);
}
