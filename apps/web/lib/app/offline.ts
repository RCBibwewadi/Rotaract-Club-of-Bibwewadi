'use client';

import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

/** True while the device reports no connection. */
export function useOffline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => !window.navigator.onLine,
    () => false, // the server cannot know; assume online so nothing flashes
  );
}
