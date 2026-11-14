'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Registered in production only so the dev server's HMR is never served from cache.
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch(() => {});
  }, []);

  return null;
}
