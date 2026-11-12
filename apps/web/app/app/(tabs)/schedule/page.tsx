'use client';

import { useState } from 'react';
import { CalendarDays, MapPin } from 'lucide-react';
import { useResource } from '@/lib/app/client';
import { Screen, Loading, ErrorState, EmptyState, Avatar } from '@/components/app/Screen';

interface AppEvent {
  event_id: string;
  event_name: string;
  event_date: string;
  event_time: string | null;
  event_place: string | null;
  event_avenue: string | null;
  event_description: string | null;
  members: { member_id: string; full_name: string; avatar_url: string | null } | null;
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

export default function SchedulePage() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const events = useResource<AppEvent[]>(`/api/events/${tab}`);

  return (
    <Screen title="Schedule" subtitle="Club events and projects">
      <div
        role="tablist"
        aria-label="Event timeframe"
        className="mb-4 flex gap-1 rounded-full bg-app-plum/5 p-1"
      >
        {(['upcoming', 'past'] as const).map((option) => (
          <button
            key={option}
            role="tab"
            aria-selected={tab === option}
            onClick={() => setTab(option)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold capitalize transition-colors ${
              tab === option ? 'bg-white text-app-plum shadow-sm' : 'text-app-plum/50'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {events.loading && <Loading label="Loading events" />}
      {events.error && <ErrorState message={events.error} onRetry={events.reload} />}

      {events.data?.length === 0 && (
        <EmptyState
          title={tab === 'upcoming' ? 'Nothing scheduled' : 'No past events'}
          body={
            tab === 'upcoming'
              ? 'New events will show up here as soon as they are announced.'
              : 'Events the club has already run will be listed here.'
          }
        />
      )}

      <ul className="space-y-3">
        {events.data?.map((event) => (
          <li key={event.event_id} className="rounded-2xl bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-accent">
              <CalendarDays size={14} aria-hidden />
              <time dateTime={event.event_date}>{formatDate(event.event_date)}</time>
              {event.event_time && <span className="text-app-plum/40">{event.event_time}</span>}
            </div>

            <h2 className="mt-2 text-[17px] leading-snug font-bold text-app-plum">
              {event.event_name}
            </h2>

            {event.event_description && (
              <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-app-plum/60">
                {event.event_description}
              </p>
            )}

            {event.event_place && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-app-plum/50">
                <MapPin size={14} aria-hidden />
                {event.event_place}
              </p>
            )}

            {event.members && (
              <div className="mt-3 flex items-center gap-2 border-t border-black/5 pt-3">
                <Avatar name={event.members.full_name} src={event.members.avatar_url} size={26} />
                <span className="text-xs text-app-plum/50">
                  Led by <span className="font-semibold text-app-plum/75">{event.members.full_name}</span>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Screen>
  );
}
