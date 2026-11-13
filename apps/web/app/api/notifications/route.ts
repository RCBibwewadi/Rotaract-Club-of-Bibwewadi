import { NextRequest } from 'next/server';
import { supabase } from '../lib/supabase';
import { json, authenticate, requireApproved, handleError } from '../lib/middleware';
import { NOTIFIED_TABS, isNotifiedTab, type NotifiedTab } from '../lib/push';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

export type UnreadCounts = Record<NotifiedTab, number> & { total: number };

/**
 * Rows posted since the member last opened the tab. Their own posts never
 * count: the Ideas and Connect feeds are mostly the member's own doing.
 */
const SOURCES: Record<NotifiedTab, { table: string; id: string }> = {
  ideas: { table: 'ideas', id: 'idea_id' },
  schedule: { table: 'events', id: 'event_id' },
  announcements: { table: 'announcements', id: 'announcement_id' },
  referrals: { table: 'referrals', id: 'referral_id' },
};

async function countSince(
  tab: NotifiedTab,
  since: string,
  memberId: string,
): Promise<number> {
  const source = SOURCES[tab];
  let query = supabase
    .from(source.table)
    .select(source.id, { count: 'exact', head: true })
    .gt('created_at', since);

  if (tab === 'ideas' || tab === 'referrals') {
    query = query.neq('member_id', memberId);
  } else if (tab === 'schedule') {
    // Only events that have not already happened — an old event added to the
    // archive is not news.
    query = query.gte('event_date', new Date().toISOString().split('T')[0]);
  }

  const { count, error } = await query;
  if (error) {
    console.error(`Unread count failed for ${tab}:`, error.message);
    return 0;
  }
  return count ?? 0;
}

/** The numbers on the tab bar, and the number on the home-screen icon. */
export async function GET(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    const { data: reads, error } = await supabase
      .from('tab_reads')
      .select('tab, last_seen_at')
      .eq('member_id', user.member_id);

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    const seen = new Map((reads ?? []).map((row) => [row.tab as string, row.last_seen_at as string]));
    const now = new Date().toISOString();

    // A member who has never opened a tab starts with a clean slate rather
    // than a badge counting the club's whole history, so the watermark is laid
    // down on first read. ignoreDuplicates keeps a concurrent request from
    // resetting a watermark that already exists.
    const missing = NOTIFIED_TABS.filter((tab) => !seen.has(tab));
    if (missing.length > 0) {
      await supabase
        .from('tab_reads')
        .upsert(
          missing.map((tab) => ({ member_id: user.member_id, tab, last_seen_at: now })),
          { onConflict: 'member_id,tab', ignoreDuplicates: true },
        );
    }

    const counts = await Promise.all(
      NOTIFIED_TABS.map((tab) =>
        countSince(tab, seen.get(tab) ?? now, user.member_id).then(
          (count) => [tab, count] as const,
        ),
      ),
    );

    const result = Object.fromEntries(counts) as Record<NotifiedTab, number>;
    return json(
      successResponse({
        ...result,
        total: counts.reduce((sum, [, count]) => sum + count, 0),
      } satisfies UnreadCounts),
    );
  } catch (err) {
    return handleError(err);
  }
}

/** Marks one tab read, which is what clears its badge. */
export async function POST(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    const { tab } = (await request.json().catch(() => ({}))) as { tab?: unknown };
    if (!isNotifiedTab(tab)) {
      return json(errorResponse('VALIDATION_ERROR', 'Unknown tab'), 400);
    }

    const { error } = await supabase.from('tab_reads').upsert(
      { member_id: user.member_id, tab, last_seen_at: new Date().toISOString() },
      { onConflict: 'member_id,tab' },
    );

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse({ tab }));
  } catch (err) {
    return handleError(err);
  }
}
