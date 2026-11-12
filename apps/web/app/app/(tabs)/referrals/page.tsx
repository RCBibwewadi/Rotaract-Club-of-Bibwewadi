'use client';

import { useMemo, useState } from 'react';
import { Globe, MessageCircle, Phone, Search } from 'lucide-react';
import { useResource } from '@/lib/app/client';
import { waNumber } from '@/lib/app/format';
import { Screen, Loading, ErrorState, EmptyState, Avatar } from '@/components/app/Screen';

interface BusinessListing {
  business_id: string;
  business_name: string;
  industry: string | null;
  designation: string | null;
  description: string | null;
  website_url: string | null;
  business_city: string | null;
  members: {
    member_id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    member_visibility: { show_contact: boolean; open_to_collab: boolean }[] | null;
  } | null;
}

export default function ReferralsPage() {
  const listings = useResource<BusinessListing[]>('/api/businesses');
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle || !listings.data) return listings.data ?? [];
    return listings.data.filter((item) =>
      [item.business_name, item.industry, item.business_city, item.members?.full_name]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle)),
    );
  }, [listings.data, query]);

  return (
    <Screen title="Referrals" subtitle="Businesses run by members">
      <div className="relative mb-4">
        <Search
          size={17}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-app-plum/35"
          aria-hidden
        />
        <label htmlFor="referral-search" className="sr-only">
          Search businesses
        </label>
        <input
          id="referral-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, industry or city"
          className="w-full rounded-2xl border border-app-plum/10 bg-white py-3.5 pr-4 pl-11 text-[15px] text-app-plum placeholder-app-plum/30 outline-none focus:border-app-pink"
        />
      </div>

      {listings.loading && <Loading label="Loading businesses" />}
      {listings.error && <ErrorState message={listings.error} onRetry={listings.reload} />}

      {listings.data && results.length === 0 && (
        <EmptyState
          title={query ? 'No matches' : 'No businesses listed'}
          body={
            query
              ? 'Try a different name, industry or city.'
              : 'Members who add a business to their profile will show up here.'
          }
        />
      )}

      <ul className="space-y-3">
        {results.map((item) => {
          const visibility = item.members?.member_visibility?.[0];
          const phone = visibility?.show_contact ? item.members?.phone : null;

          return (
            <li key={item.business_id} className="rounded-2xl bg-white p-4">
              <div className="flex items-start gap-3">
                <Avatar
                  name={item.members?.full_name ?? item.business_name}
                  src={item.members?.avatar_url}
                  size={40}
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[16px] font-bold text-app-plum">
                    {item.business_name}
                  </h2>
                  <p className="truncate text-sm text-app-plum/55">
                    {[item.industry, item.business_city].filter(Boolean).join(' · ') ||
                      'Member business'}
                  </p>
                </div>
                {visibility?.open_to_collab && (
                  <span className="shrink-0 rounded-full bg-accent/8 px-2.5 py-1 text-[11px] font-semibold text-accent">
                    Open to collab
                  </span>
                )}
              </div>

              {item.description && (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-app-plum/60">
                  {item.description}
                </p>
              )}

              <p className="mt-3 text-xs text-app-plum/45">
                {[item.members?.full_name, item.designation].filter(Boolean).join(' · ')}
              </p>

              {(phone || item.website_url) && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-black/5 pt-3">
                  {phone && (
                    <>
                      <a
                        href={`tel:${phone}`}
                        className="flex items-center gap-1.5 rounded-full bg-app-plum/5 px-3.5 py-2 text-sm font-medium text-app-plum/70"
                      >
                        <Phone size={15} aria-hidden />
                        Call
                      </a>
                      <a
                        href={`https://wa.me/${waNumber(phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-full bg-app-plum/5 px-3.5 py-2 text-sm font-medium text-app-plum/70"
                      >
                        <MessageCircle size={15} aria-hidden />
                        WhatsApp
                      </a>
                    </>
                  )}
                  {item.website_url && (
                    <a
                      href={item.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full bg-app-plum/5 px-3.5 py-2 text-sm font-medium text-app-plum/70"
                    >
                      <Globe size={15} aria-hidden />
                      Website
                    </a>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
