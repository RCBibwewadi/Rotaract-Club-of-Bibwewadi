'use client';

import { useMemo, useState } from 'react';
import { Check, Loader2, Search, Trash2, UserMinus, UserPlus, X } from 'lucide-react';
import { useResource, ApiError } from '@/lib/app/client';
import { adminFetch } from '@/lib/app/admin';
import { Loading, ErrorState, EmptyState, Avatar } from '@/components/app/Screen';
import AdminScreen, { NoticeBanner, useNotice } from '@/components/app/AdminScreen';

interface AdminMember {
  member_id: string;
  full_name: string;
  email: string;
  username: string;
  phone?: string | null;
  member_type: string;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
}

export default function AdminMembersPage() {
  const [view, setView] = useState<'pending' | 'all'>('pending');
  const members = useResource<AdminMember[]>(`/api/admin/members/${view}`, adminFetch);
  const [notice, showNotice] = useNotice();
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle || !members.data) return members.data ?? [];
    return members.data.filter((member) =>
      [member.full_name, member.email, member.username]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(needle)),
    );
  }, [members.data, query]);

  const act = async (member: AdminMember, action: string, label: string) => {
    setBusy(member.member_id);
    try {
      await adminFetch(`/api/admin/members/${member.member_id}/${action}`, { method: 'PATCH' });
      showNotice(`${member.full_name}: ${label}`, 'success');
      members.reload();
    } catch (err) {
      showNotice(err instanceof ApiError ? err.message : `${label} failed`, 'error');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (member: AdminMember) => {
    if (!window.confirm(`Permanently delete ${member.full_name}? This cannot be undone.`)) return;
    setBusy(member.member_id);
    try {
      await adminFetch(`/api/admin/members/${member.member_id}/delete`, { method: 'DELETE' });
      showNotice(`${member.full_name} deleted`, 'success');
      members.reload();
    } catch (err) {
      showNotice(err instanceof ApiError ? err.message : 'Delete failed', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminScreen title="Members">
      <NoticeBanner notice={notice} />

      <div
        role="tablist"
        aria-label="Member list"
        className="mb-3 flex gap-1 rounded-full bg-app-plum/5 p-1"
      >
        {(['pending', 'all'] as const).map((option) => (
          <button
            key={option}
            role="tab"
            aria-selected={view === option}
            onClick={() => setView(option)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold capitalize transition-colors ${
              view === option ? 'bg-white text-app-plum shadow-sm' : 'text-app-plum/50'
            }`}
          >
            {option === 'pending' ? 'Pending' : 'All members'}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search
          size={17}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-app-plum/35"
          aria-hidden
        />
        <label htmlFor="admin-member-search" className="sr-only">
          Search members
        </label>
        <input
          id="admin-member-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or username"
          className="w-full rounded-2xl border border-app-plum/10 bg-white py-3.5 pr-4 pl-11 text-[15px] text-app-plum placeholder-app-plum/30 outline-none focus:border-app-pink"
        />
      </div>

      {members.loading && <Loading label="Loading members" />}
      {members.error && <ErrorState message={members.error} onRetry={members.reload} />}

      {members.data && results.length === 0 && (
        <EmptyState
          title={query ? 'No matches' : view === 'pending' ? 'Nothing to review' : 'No members'}
          body={
            query
              ? 'Try another name, email or username.'
              : view === 'pending'
                ? 'New sign-ups waiting for approval show up here.'
                : 'Approved members will be listed here.'
          }
        />
      )}

      <ul className="space-y-2.5">
        {results.map((member) => {
          const working = busy === member.member_id;

          return (
            <li key={member.member_id} className="rounded-2xl bg-white p-4">
              <div className="flex items-start gap-3">
                <Avatar name={member.full_name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-app-plum">
                    {member.full_name}
                  </p>
                  <p className="truncate text-sm text-app-plum/50">{member.email}</p>
                  <p className="mt-0.5 truncate text-xs text-app-plum/35">
                    @{member.username}
                    {member.phone ? ` · ${member.phone}` : ''}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    !member.is_active
                      ? 'bg-app-plum/8 text-app-plum/50'
                      : member.is_approved
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-accent/8 text-accent'
                  }`}
                >
                  {!member.is_active ? 'Inactive' : member.is_approved ? 'Approved' : 'Pending'}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 border-t border-black/5 pt-3">
                {working && (
                  <span className="flex items-center gap-2 px-2 text-sm text-app-plum/45">
                    <Loader2 size={15} className="animate-spin" aria-hidden />
                    Working…
                  </span>
                )}

                {!working && !member.is_approved && member.is_active && (
                  <>
                    <ActionButton
                      icon={Check}
                      label="Approve"
                      tone="go"
                      onClick={() => act(member, 'approve', 'approved')}
                    />
                    <ActionButton
                      icon={X}
                      label="Reject"
                      tone="stop"
                      onClick={() => act(member, 'reject', 'rejected')}
                    />
                  </>
                )}

                {!working && member.is_approved && member.is_active && (
                  <ActionButton
                    icon={UserMinus}
                    label="Deactivate"
                    tone="stop"
                    onClick={() => act(member, 'deactivate', 'deactivated')}
                  />
                )}

                {!working && !member.is_active && (
                  <ActionButton
                    icon={UserPlus}
                    label="Reactivate"
                    tone="go"
                    onClick={() => act(member, 'reactivate', 'reactivated')}
                  />
                )}

                {!working && (
                  <ActionButton
                    icon={Trash2}
                    label="Delete"
                    tone="stop"
                    onClick={() => remove(member)}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </AdminScreen>
  );
}

function ActionButton({
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  icon: typeof Check;
  label: string;
  tone: 'go' | 'stop';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ${
        tone === 'go' ? 'bg-emerald-50 text-emerald-700' : 'bg-accent/5 text-accent'
      }`}
    >
      <Icon size={15} aria-hidden />
      {label}
    </button>
  );
}
