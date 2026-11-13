'use client';

import { useSyncExternalStore } from 'react';
import { ApiError } from './client';

/**
 * Admin session for the mobile app. It deliberately uses the same
 * sessionStorage keys and 24-hour token as the website's admin panel: the
 * token dies with the session rather than lingering on the device.
 */
const ADMIN_AUTH_KEY = 'rcb-admin-auth';
const ADMIN_TOKEN_KEY = 'rcb-admin-token';

/** The username the app asks for; the password is the website's own. */
export const ADMIN_USERNAME = 'admin@rcb.com';

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export function getAdminToken(): string {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setAdminToken(token: string) {
  try {
    sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // Storage can be denied in private browsing; the session then lasts only
    // as long as this page stays open.
  }
  notify();
}

export function clearAdminToken() {
  try {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // ignore
  }
  notify();
}

/** True once an admin has signed in on this session. */
export function useAdminAuth(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => getAdminToken() !== '',
    () => false,
  );
}

export async function adminLogin(username: string, password: string): Promise<string> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(data?.error || 'Invalid admin credentials', res.status);
  }

  setAdminToken(data.token);
  return data.token;
}

/**
 * Authorised fetch for admin endpoints. A 401/403 means the 24-hour token has
 * expired, so the session is dropped and the gate sends the admin back to the
 * sign-in screen.
 */
export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        // FormData sets its own multipart boundary; naming a type here breaks it.
        ...(init.body && !(init.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        Authorization: `Bearer ${getAdminToken()}`,
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError('You appear to be offline. Try again.', 0);
  }

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) clearAdminToken();
    throw new ApiError(
      payload?.error?.message || payload?.message || payload?.error || 'Something went wrong.',
      res.status,
    );
  }

  return (payload?.data ?? payload) as T;
}
