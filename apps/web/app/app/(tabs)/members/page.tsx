'use client';

import { useMemo, useState } from 'react';
import { Mail, Phone, Search } from 'lucide-react';
import { useResource } from '@/lib/app/client';
import type { MemberProfile } from '@/lib/auth-store';
import { Screen, Loading, ErrorState, EmptyState, Avatar } from '@/components/app/Screen';

export default function MembersPage() {
  const members = useResource<MemberProfile[]>('/api/members');
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle || !members.data) return members.data ?? [];
    return members.data.filter((member) =>
      [member.full_name, member.member_type, member.college_name]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle)),
    );
  }, [members.data, query]);

  // /api/members returns every approved, active member except the viewer —
  // who is approved too, since the API refuses anyone who is not.
  const total = members.data ? members.data.length + 1 : null;

  return (
    <Screen
      title="Members"
      subtitle={total === null ? 'The club directory' : `The club directory of ${total}`}
    >
      <div className="relative mb-4">
        <Search
          size={17}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-app-plum/35"
          aria-hidden
        />
        <label htmlFor="member-search" className="sr-only">
          Search members
        </label>
        <input
          id="member-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members"
          className="w-full rounded-2xl border border-app-plum/10 bg-white py-3.5 pr-4 pl-11 text-[15px] text-app-plum placeholder-app-plum/30 outline-none focus:border-app-pink"
        />
      </div>

      {members.loading && <Loading label="Loading members" />}
      {members.error && <ErrorState message={members.error} onRetry={members.reload} />}

      {members.data && results.length === 0 && (
        <EmptyState
          title={query ? 'No matches' : 'No members yet'}
          body={query ? 'Try another name.' : 'Approved members will be listed here.'}
        />
      )}

      <ul className="space-y-2.5">
        {results.map((member) => {
          const visibility = member.member_visibility?.[0];
          const showContact = visibility?.show_contact ?? false;

          return (
            <li key={member.member_id} className="flex items-center gap-3 rounded-2xl bg-white p-4">
              <Avatar name={member.full_name} src={member.avatar_url} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-app-plum">
                  {member.full_name}
                </p>
                <p className="truncate text-sm text-app-plum/50">
                  {member.member_type?.split(',').join(' · ') || 'Member'}
                </p>
              </div>

              {showContact && (
                <div className="flex shrink-0 gap-1.5">
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      aria-label={`Call ${member.full_name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-app-plum/5 text-app-plum/60"
                    >
                      <Phone size={16} aria-hidden />
                    </a>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      aria-label={`Email ${member.full_name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-app-plum/5 text-app-plum/60"
                    >
                      <Mail size={16} aria-hidden />
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
