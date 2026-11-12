'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRefreshKey } from './refresh';

export { timeAgo } from './format';

/**
 * Thrown by appFetch so screens can show the API's own message rather than a
 * generic failure string.
 */
export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/**
 * Authorised fetch for the mobile app. Sends the same JWT the website uses and
 * routes a 401 back through the auth store, so an expired session logs the
 * member out everywhere instead of leaving dead screens behind.
 */
export async function appFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { token, handleAuthFailure } = useAuthStore.getState();

  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        // FormData sets its own multipart boundary; naming a type here breaks it.
        ...(init.body && !(init.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError('You appear to be offline. Try again.', 0);
  }

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    handleAuthFailure(res.status);
    const message =
      payload?.error?.message || payload?.message || 'Something went wrong. Try again.';
    throw new ApiError(message, res.status);
  }

  return payload?.data as T;
}

export interface Resource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  /** Lets a screen apply an optimistic change without a round trip. */
  set: (next: T) => void;
}

/**
 * Loads a GET endpoint into the loading / empty / error states every screen
 * needs. `path` of null means "not ready yet" (e.g. waiting on hydration).
 */
export function useResource<T>(
  path: string | null,
  // Admin screens pass adminFetch; it must be a stable reference, which the
  // module-level fetchers are.
  fetcher: (path: string) => Promise<T> = appFetch,
): Resource<T> {
  const [nonce, setNonce] = useState(0);
  // A global refresh re-runs every mounted resource.
  const revision = useRefreshKey();
  // The settled result carries the request it belongs to, so "loading" is
  // derived rather than set at the top of the effect — switching paths shows
  // the spinner again without a second render pass.
  const key = path === null ? null : `${nonce}:${revision}:${path}`;
  const [settled, setSettled] = useState<{
    key: string;
    data: T | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!path || key === null) return;
    let cancelled = false;

    fetcher(path)
      .then((result) => {
        if (!cancelled) setSettled({ key, data: result, error: null });
      })
      .catch((err: ApiError) => {
        if (!cancelled) setSettled({ key, data: null, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [path, key, fetcher]);

  const current = settled?.key === key ? settled : null;
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const set = useCallback(
    (next: T) => setSettled((prev) => (prev ? { ...prev, data: next } : prev)),
    [],
  );

  return {
    data: current?.data ?? null,
    loading: key !== null && current === null,
    error: current?.error ?? null,
    reload,
    set,
  };
}
