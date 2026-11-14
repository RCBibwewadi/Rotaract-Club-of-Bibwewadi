'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin, Search, Trash2, Users, Wallet } from 'lucide-react';
import { appFetch, useResource, timeAgo, ApiError } from '@/lib/app/client';
import type { Referral } from '@/lib/app/types';
import { Screen, Loading, ErrorState, EmptyState, Avatar } from '@/components/app/Screen';
import Fab from '@/components/app/Fab';

export default function ReferralsPage() {
  const referrals = useResource<Referral[]>('/api/referrals');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const remove = async (referralId: string) => {
    if (!referrals.data || !window.confirm('Remove this referral?')) return;
    const before = referrals.data;
    // Drop it straight away; put the list back if the write fails.
    referrals.set(before.filter((item) => item.referral_id !== referralId));
    try {
      await appFetch(`/api/referrals/${referralId}`, { method: 'DELETE' });
    } catch (err) {
      referrals.set(before);
      setError(err instanceof ApiError ? err.message : 'Could not remove that referral');
    }
  };

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle || !referrals.data) return referrals.data ?? [];
    return referrals.data.filter((item) =>
      [item.title, item.description, item.location, item.author?.full_name]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle)),
    );
  }, [referrals.data, query]);

  return (
    <Screen
      title="The Connect"
      subtitle="Share opportunities and help each other grow."
    >
      <div className="relative mb-4">
        <Search
          size={17}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-app-plum/35"
          aria-hidden
        />
        <label htmlFor="referral-search" className="sr-only">
          Search referrals
        </label>
        <input
          id="referral-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by what is needed, place or member"
          className="w-full rounded-2xl border border-app-plum/10 bg-white py-3.5 pr-4 pl-11 text-[15px] text-app-plum placeholder-app-plum/30 outline-none focus:border-app-pink"
        />
      </div>

      {error && (
        <p role="alert" className="mb-3 text-sm text-accent">
          {error}
        </p>
      )}

      {referrals.loading && <Loading label="Loading referrals" />}
      {referrals.error && <ErrorState message={referrals.error} onRetry={referrals.reload} />}

      {referrals.data && results.length === 0 && (
        <EmptyState
          title={query ? 'No matches' : 'No referrals yet'}
          body={
            query
              ? 'Try another word, place or member.'
              : 'Need a vendor, a job lead or an introduction? Post the first referral.'
          }
        />
      )}

      <ul className="space-y-3">
        {results.map((item) => (
          <li key={item.referral_id} className="relative">
            <Link
              href={`/app/referrals/${item.referral_id}`}
              className="block rounded-2xl border border-accent bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <Avatar
                  name={item.author?.full_name ?? 'Member'}
                  src={item.author?.avatar_url}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[16px] font-bold text-app-plum">{item.title}</h2>
                  <p className="truncate text-xs text-app-plum/45">
                    {[item.author?.full_name ?? 'Former member', timeAgo(item.created_at)].join(' · ')}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    item.status === 'open'
                      ? 'bg-accent/8 text-accent'
                      : 'bg-app-plum/5 text-app-plum/45'
                  }`}
                >
                  {item.status === 'open' ? 'Open' : 'Closed'}
                </span>
              </div>

              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-app-plum/60">
                {item.description}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-app-plum/50">
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} aria-hidden />
                  {item.location}
                </span>
                {item.budget && (
                  <span className="flex items-center gap-1.5">
                    <Wallet size={13} aria-hidden />
                    {item.budget}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users size={13} aria-hidden />
                  {item.interest_count} interested
                </span>
              </div>
            </Link>

            {item.is_mine && (
              <button
                type="button"
                onClick={() => remove(item.referral_id)}
                aria-label={`Remove ${item.title}`}
                className="absolute right-3 bottom-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-accent/5 text-accent"
              >
                <Trash2 size={15} aria-hidden />
              </button>
            )}
          </li>
        ))}
      </ul>

      <Fab href="/app/referrals/new" label="Post a referral" />
    </Screen>
  );
}
