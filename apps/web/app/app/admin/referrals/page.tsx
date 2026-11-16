'use client';

import { useState } from 'react';
import { Loader2, MapPin, Trash2, Users, Wallet } from 'lucide-react';
import { timeAgo, useResource, ApiError } from '@/lib/app/client';
import { adminFetch } from '@/lib/app/admin';
import type { Referral } from '@/lib/app/types';
import { Loading, ErrorState, EmptyState, Avatar } from '@/components/app/Screen';
import AdminScreen, { NoticeBanner, useNotice } from '@/components/app/AdminScreen';

export default function AdminReferralsPage() {
  const referrals = useResource<Referral[]>('/api/referrals', adminFetch);
  const [notice, showNotice] = useNotice();
  const [busy, setBusy] = useState<string | null>(null);

  const remove = async (referral: Referral) => {
    if (!window.confirm(`Delete "${referral.title}"? This cannot be undone.`)) return;
    setBusy(referral.referral_id);
    try {
      await adminFetch(`/api/referrals/${referral.referral_id}`, { method: 'DELETE' });
      referrals.set(
        (referrals.data ?? []).filter((r) => r.referral_id !== referral.referral_id),
      );
      showNotice('Referral deleted', 'success');
    } catch (err) {
      showNotice(err instanceof ApiError ? err.message : 'Delete failed', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminScreen title="The Connect">
      <NoticeBanner notice={notice} />

      {referrals.loading && <Loading label="Loading referrals" />}
      {referrals.error && <ErrorState message={referrals.error} onRetry={referrals.reload} />}

      {referrals.data?.length === 0 && (
        <EmptyState title="No referrals" body="Member posts appear here for moderation." />
      )}

      <ul className="space-y-3">
        {referrals.data?.map((referral) => (
          <li key={referral.referral_id} className="rounded-2xl bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2.5">
                <Avatar
                  name={referral.author?.full_name ?? 'Member'}
                  src={referral.author?.avatar_url}
                  size={32}
                />
                <div className="min-w-0">
                  <h2 className="text-[16px] leading-snug font-bold text-app-plum">
                    {referral.title}
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-app-plum/45">
                    {referral.author?.full_name ?? 'Former member'} ·{' '}
                    {timeAgo(referral.created_at)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => remove(referral)}
                disabled={busy === referral.referral_id}
                aria-label={`Delete ${referral.title}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/5 text-accent disabled:opacity-50"
              >
                {busy === referral.referral_id ? (
                  <Loader2 size={15} className="animate-spin" aria-hidden />
                ) : (
                  <Trash2 size={15} aria-hidden />
                )}
              </button>
            </div>

            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-app-plum/60">
              {referral.description}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-app-plum/50">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} aria-hidden />
                {referral.location}
              </span>
              {referral.budget && (
                <span className="flex items-center gap-1.5">
                  <Wallet size={13} aria-hidden />
                  {referral.budget}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users size={13} aria-hidden />
                {referral.interest_count} interested
              </span>
            </div>
          </li>
        ))}
      </ul>
    </AdminScreen>
  );
}
