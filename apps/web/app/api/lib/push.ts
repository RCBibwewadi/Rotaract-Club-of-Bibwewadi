import {
  sendNotification,
  setVapidDetails,
  WebPushError,
  type PushSubscription,
} from 'web-push';
import { supabase } from './supabase';

/**
 * The four tabs that carry new content, and so a badge and a push. Profile and
 * Members hold nothing that arrives on its own.
 */
export const NOTIFIED_TABS = ['ideas', 'schedule', 'announcements', 'referrals'] as const;
export type NotifiedTab = (typeof NOTIFIED_TABS)[number];

export function isNotifiedTab(value: unknown): value is NotifiedTab {
  return NOTIFIED_TABS.includes(value as NotifiedTab);
}

export interface PushPayload {
  title: string;
  body: string;
  /** Which tab the badge belongs to; also the notification's collapse tag. */
  tab: NotifiedTab;
  /** Where a tap lands. */
  url: string;
}

let configured: boolean | null = null;

/**
 * VAPID identifies this server to the push services. Without the keys the app
 * still works — members simply get no pushes — so a missing env is logged
 * once rather than thrown: posting an idea must not fail because of it.
 */
function ready(): boolean {
  if (configured === null) {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    configured = Boolean(publicKey && privateKey);
    if (configured) {
      setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:rotaractclubofbibwewadi@gmail.com',
        publicKey!,
        privateKey!,
      );
    } else {
      console.warn('Push disabled: VAPID keys are not configured');
    }
  }
  return configured;
}

interface SubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
  member_id: string;
}

/**
 * Pushes to every member who has granted permission, except the one who caused
 * the event — nobody needs telling about their own post.
 *
 * Never throws: a push failure must not turn a successful POST into a 500.
 * Call it from `after()` so the member's request is not held up by it.
 */
export async function notifyMembers(
  payload: PushPayload,
  exceptMemberId?: string | null,
): Promise<void> {
  if (!ready()) return;

  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, member_id');

  if (error) {
    console.error('Push lookup failed:', error.message);
    return;
  }

  const rows = ((data ?? []) as SubscriptionRow[]).filter(
    (row) => row.member_id !== exceptMemberId,
  );
  if (rows.length === 0) return;

  const body = JSON.stringify(payload);
  const dead: string[] = [];

  await Promise.all(
    rows.map(async (row) => {
      const subscription: PushSubscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      };
      try {
        await sendNotification(subscription, body, { TTL: 24 * 60 * 60 });
      } catch (err) {
        // 404/410 mean the browser threw the subscription away (app deleted,
        // permission revoked). Anything else is transient — leave it alone.
        if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
          dead.push(row.endpoint);
        } else {
          console.error('Push send failed:', err);
        }
      }
    }),
  );

  if (dead.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', dead);
  }
}
