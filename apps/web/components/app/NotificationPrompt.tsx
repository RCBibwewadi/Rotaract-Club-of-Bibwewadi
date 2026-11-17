'use client';

import { useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { enablePush, pushState } from '@/lib/app/notifications';

/**
 * Asks a signed-in member to turn on push as soon as they reach the app, if
 * they have not yet. The OS prompt itself only opens from the button tap:
 * iOS refuses Notification.requestPermission() without a user gesture.
 *
 * "Not now" lasts until the app is next opened. A member who blocked
 * notifications is not asked: the OS will not show its prompt again, and the
 * profile screen explains how to undo it.
 */
export default function NotificationPrompt() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    pushState()
      .then((state) => live && setOpen(state === 'off'))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (!open) return null;

  const allow = async () => {
    setBusy(true);
    try {
      await enablePush();
    } catch {
      // The profile switch remains for another try.
    }
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 px-4 backdrop-blur-sm"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-prompt-title"
    >
      <div className="w-full max-w-sm rounded-3xl bg-app-panel p-6 shadow-2xl">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Bell size={22} aria-hidden />
        </span>
        <h2
          id="notification-prompt-title"
          className="mt-4 text-lg font-semibold tracking-tight text-app-plum"
        >
          Turn on notifications
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-app-plum/55">
          Hear about new ideas, referrals, bulletins and events as they happen.
        </p>
        <button
          type="button"
          onClick={() => void allow()}
          disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-base font-semibold text-white transition-colors hover:bg-accent-light disabled:opacity-60"
        >
          {busy && <Loader2 size={18} className="animate-spin" aria-hidden />}
          Allow notifications
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={busy}
          className="mt-2 w-full py-2.5 text-sm font-medium text-app-plum/50"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
