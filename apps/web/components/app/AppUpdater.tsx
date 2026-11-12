'use client';

import { useEffect } from 'react';
import { checkForAppUpdate } from '@/lib/app/update';

/**
 * Keeps an installed app on the current build.
 *
 * A standalone PWA resumes the page it had open instead of navigating afresh,
 * so a deploy never reaches it: the old JavaScript keeps running until the OS
 * kills the process. This checks on open, on returning to the foreground and
 * when the network comes back; pulling a screen down checks too.
 */
export default function AppUpdater() {
  useEffect(() => {
    const check = () => {
      void checkForAppUpdate();
    };

    check();
    document.addEventListener('visibilitychange', check);
    window.addEventListener('online', check);

    return () => {
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('online', check);
    };
  }, []);

  return null;
}
