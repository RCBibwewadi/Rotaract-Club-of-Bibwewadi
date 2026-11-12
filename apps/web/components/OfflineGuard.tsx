'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';
import { installOfflineGuard } from '@/lib/offline';

function subscribeToConnection(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

export default function OfflineGuard() {
  const blockedWhileOffline = useRef(false);

  const offline = useSyncExternalStore(
    subscribeToConnection,
    () => !window.navigator.onLine,
    () => false, // the server cannot know; assume online so nothing flashes
  );

  useEffect(() => {
    const uninstall = installOfflineGuard(window, () => {
      blockedWhileOffline.current = true;
    });

    // Something was refused while the connection was down, so what is on
    // screen is stale. A reload is the only way to revalidate the app's 72
    // scattered client fetches; without it the user keeps staring at dead
    // data. Gated on an actual block so an untouched page is not reloaded
    // out from under the reader.
    const revalidate = () => {
      if (blockedWhileOffline.current) window.location.reload();
    };

    window.addEventListener('online', revalidate);
    return () => {
      uninstall();
      window.removeEventListener('online', revalidate);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[300] flex items-center justify-center gap-3 border-t border-accent/30 bg-light-card dark:bg-dark-card px-4 py-3 text-sm"
    >
      <WifiOff size={18} className="text-accent shrink-0" />
      <span className="opacity-80">
        You&apos;re offline — showing the last loaded page. Actions are paused.
      </span>
    </div>
  );
}
