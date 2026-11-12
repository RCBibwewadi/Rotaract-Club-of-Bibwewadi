'use client';

import { timeAgo, useResource } from '@/lib/app/client';
import type { Announcement } from '@/lib/app/types';
import { Screen, Loading, ErrorState, EmptyState } from '@/components/app/Screen';

export default function AnnouncementsPage() {
  const notices = useResource<Announcement[]>('/api/announcements');

  return (
    <Screen title="Announcements" subtitle="Notices from the board">
      {notices.loading && <Loading label="Loading announcements" />}
      {notices.error && <ErrorState message={notices.error} onRetry={notices.reload} />}

      {notices.data?.length === 0 && (
        <EmptyState
          title="Nothing new"
          body="Club notices from the board will appear here."
        />
      )}

      <ul className="space-y-3">
        {notices.data?.map((notice) => (
          <li key={notice.announcement_id} className="rounded-2xl bg-white p-4">
            <p className="text-xs font-semibold text-accent">{timeAgo(notice.created_at)}</p>
            <h2 className="mt-1.5 text-[17px] leading-snug font-bold text-app-plum">
              {notice.title}
            </h2>
            {notice.body && (
              <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-app-plum/65">
                {notice.body}
              </p>
            )}
            {notice.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={notice.image_url}
                alt=""
                className="mt-3 max-h-64 w-full rounded-xl object-cover"
                loading="lazy"
              />
            )}
            {notice.members && (
              <p className="mt-3 text-xs text-app-plum/40">Posted by {notice.members.full_name}</p>
            )}
          </li>
        ))}
      </ul>
    </Screen>
  );
}
