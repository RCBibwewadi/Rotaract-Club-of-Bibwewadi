'use client';

import { useSyncExternalStore } from 'react';

/**
 * One refresh for the whole app.
 *
 * Every screen's data hangs off this counter, so a single pull refetches all
 * of it — the current screen, the member's own profile, anything else mounted
 * — instead of each screen needing its own refresh wiring.
 */
let revision = 0;
const listeners = new Set<() => void>();

export function refreshAll() {
  revision += 1;
  listeners.forEach((fn) => fn());
}

/** Changes whenever refreshAll() is called; use it as a data dependency. */
export function useRefreshKey(): number {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => revision,
    () => 0,
  );
}
