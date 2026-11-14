/**
 * The pure half of the notification badges — no React, no browser APIs, so
 * badges.check.ts can run it on plain Node. The wiring lives in
 * notifications.ts.
 */

/** The tabs that carry new content. Mirrors NOTIFIED_TABS in api/lib/push.ts. */
export const NOTIFIED_TABS = ['ideas', 'schedule', 'announcements', 'referrals'] as const;
export type NotifiedTab = (typeof NOTIFIED_TABS)[number];

export type UnreadCounts = Record<NotifiedTab, number> & { total: number };

export const NO_UNREAD: UnreadCounts = {
  ideas: 0,
  schedule: 0,
  announcements: 0,
  referrals: 0,
  total: 0,
};

/** The tab a path belongs to, or null for the screens that carry no badge. */
export function tabFor(pathname: string): NotifiedTab | null {
  const match = NOTIFIED_TABS.find(
    (tab) => pathname === `/app/${tab}` || pathname.startsWith(`/app/${tab}/`),
  );
  return match ?? null;
}

/** PushManager wants the VAPID key as raw bytes, not the base64url it ships as. */
export function decodeKey(base64url: string): Uint8Array<ArrayBuffer> {
  const padded = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
