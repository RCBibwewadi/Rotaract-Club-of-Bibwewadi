'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { create } from 'zustand';
import { appFetch } from './client';

import { NO_UNREAD, tabFor, decodeKey, type NotifiedTab, type UnreadCounts } from './badges';

export { NOTIFIED_TABS, tabFor, type NotifiedTab, type UnreadCounts } from './badges';

// The Badging API is not in TypeScript's DOM library yet.
type Badged = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

/**
 * The number on the home-screen icon. Only an installed PWA shows one, and
 * only on platforms that support it — elsewhere these are simply absent.
 */
function paintAppBadge(total: number): void {
  if (typeof navigator === 'undefined') return;
  const nav = navigator as Badged;
  const done = total > 0 ? nav.setAppBadge?.(total) : nav.clearAppBadge?.();
  done?.catch(() => {});
}

/** Drops the banners already on screen for a tab the member is now reading. */
async function closeNotifications(tab: NotifiedTab): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const shown = (await registration?.getNotifications({ tag: tab })) ?? [];
    shown.forEach((notification) => notification.close());
  } catch {
    // Nothing to clean up if the service worker is not running.
  }
}

interface UnreadState {
  counts: UnreadCounts;
  refresh: () => Promise<void>;
  /** Clears one tab's badge, locally first so the number never lingers. */
  markSeen: (tab: NotifiedTab) => Promise<void>;
}

export const useUnreadStore = create<UnreadState>((set, get) => ({
  counts: NO_UNREAD,

  refresh: async () => {
    try {
      const counts = await appFetch<UnreadCounts>('/api/notifications');
      set({ counts });
      paintAppBadge(counts.total);
    } catch {
      // An offline or expired session is handled by appFetch; badges just stay
      // as they were rather than flashing to zero.
    }
  },

  markSeen: async (tab) => {
    const { counts } = get();
    if (counts[tab] > 0) {
      const next = { ...counts, [tab]: 0, total: Math.max(0, counts.total - counts[tab]) };
      set({ counts: next });
      paintAppBadge(next.total);
    }
    void closeNotifications(tab);
    try {
      await appFetch('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({ tab }),
      });
    } catch {
      // The watermark stays where it was; the next refresh restores the badge.
    }
  },
}));

/**
 * Keeps the badges honest: loads them once, marks the tab being viewed as
 * read, and reloads whenever the app comes back to the foreground or the
 * service worker reports a push that arrived while the app was open.
 *
 * Mounted by the tab bar, which is the one component present on every badged
 * screen. `enabled` is false in the admin area: it runs on an admin token,
 * which belongs to no member and so has nothing to count.
 */
export function useUnreadSync(enabled = true): UnreadCounts {
  const counts = useUnreadStore((s) => s.counts);
  const refresh = useUnreadStore((s) => s.refresh);
  const markSeen = useUnreadStore((s) => s.markSeen);
  const pathname = usePathname();

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  // Reading a tab clears it. The server records the moment, so content posted
  // after this point still counts.
  const tab = enabled ? tabFor(pathname) : null;
  useEffect(() => {
    if (tab) void markSeen(tab);
  }, [tab, markSeen]);

  useEffect(() => {
    if (!enabled) return;

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'rcb-unread') void refresh();
    };

    document.addEventListener('visibilitychange', onVisible);
    navigator.serviceWorker?.addEventListener('message', onMessage);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      navigator.serviceWorker?.removeEventListener('message', onMessage);
    };
  }, [enabled, refresh]);

  return enabled ? counts : NO_UNREAD;
}

// ── Subscribing ──────────────────────────────────────────────────────────────

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

/**
 * What the settings row shows. 'unsupported' is the device's doing;
 * 'unconfigured' is ours — the deployment is missing its VAPID key, which
 * looks identical to the member unless the two are told apart.
 */
export type PushState = 'on' | 'off' | 'blocked' | 'unsupported' | 'unconfigured';

export async function pushState(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';
  if (!VAPID_PUBLIC_KEY) return 'unconfigured';
  if (Notification.permission === 'denied') return 'blocked';
  const subscription = await (await registration())?.pushManager.getSubscription();
  return subscription ? 'on' : 'off';
}

/**
 * Asks for permission and registers this browser. Must be called straight from
 * a tap: iOS only shows the prompt for a user gesture.
 *
 * Returns the state to display — 'blocked' when the member said no, which
 * cannot be undone from here and needs the OS settings.
 */
export async function enablePush(): Promise<PushState> {
  if (!VAPID_PUBLIC_KEY) return 'unconfigured';

  // The service worker is registered in production only, so this is also the
  // "you are on next dev" case.
  const reg = await registration();
  if (!reg) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'blocked' : 'off';

  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      // Web push offers no silent deliveries: every push must show something.
      userVisibleOnly: true,
      applicationServerKey: decodeKey(VAPID_PUBLIC_KEY),
    }));

  await appFetch('/api/notifications/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription.toJSON()),
  });

  return 'on';
}

export async function disablePush(): Promise<PushState> {
  const subscription = await (await registration())?.pushManager.getSubscription();
  if (!subscription) return 'off';

  // Server first: a subscription we failed to forget would keep receiving
  // pushes this browser can no longer show.
  await appFetch(
    `/api/notifications/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`,
    { method: 'DELETE' },
  );
  await subscription.unsubscribe().catch(() => {});

  return 'off';
}
