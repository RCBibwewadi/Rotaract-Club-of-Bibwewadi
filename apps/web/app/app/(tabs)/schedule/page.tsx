'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Check, Loader2, MapPin, Users } from 'lucide-react';
import { appFetch, useResource, ApiError } from '@/lib/app/client';
import { EVENT_CATEGORIES } from '@/app/api/lib/events';
import { Screen, Loading, ErrorState, EmptyState, Avatar } from '@/components/app/Screen';

interface AppEvent {
  event_id: string;
  event_name: string;
  event_date: string;
  event_time: string | null;
  event_place: string | null;
  event_avenue: string | null;
  event_description: string | null;
  event_images: string[] | null;
  registration_enabled: boolean;
  attending_count: number;
  my_registration: boolean;
  capacity: number | null;
  members: { member_id: string; full_name: string; avatar_url: string | null } | null;
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

export default function SchedulePage() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [category, setCategory] = useState<string>('All');
  const events = useResource<AppEvent[]>(`/api/events/${tab}`);

  const shown = useMemo(() => {
    const all = events.data ?? [];
    return category === 'All' ? all : all.filter((e) => e.event_avenue === category);
  }, [events.data, category]);

  return (
    <Screen title="The Calendar" subtitle="Stay in sync with everything happening around us.">
      <div
        role="tablist"
        aria-label="Event timeframe"
        className="mb-3 flex gap-1 rounded-full bg-app-plum/5 p-1"
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

      {/* Category filter. Scrolls sideways: five chips do not fit a phone, and
          there is nothing to filter when the timeframe is empty. */}
      <div
        className={`no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 ${
          events.data?.length ? '' : 'hidden'
        }`}
      >
        {(['All', ...EVENT_CATEGORIES] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setCategory(option)}
            aria-pressed={category === option}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              category === option
                ? 'bg-accent text-white'
                : 'border border-app-plum/10 bg-white text-app-plum/60'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {events.loading && <Loading label="Loading events" />}
      {events.error && <ErrorState message={events.error} onRetry={events.reload} />}

      {events.data && shown.length === 0 && (
        <EmptyState
          title={category === 'All' ? 'Nothing scheduled' : 'Nothing in this category'}
          body={
            category !== 'All'
              ? 'Try another category, or check back later.'
              : tab === 'upcoming'
                ? 'New events will show up here as soon as they are announced.'
                : 'Events the club has already run will be listed here.'
          }
        />
      )}

      <ul className="space-y-4">
        {shown.map((event) => (
          <EventCard
            key={event.event_id}
            event={event}
            past={tab === 'past'}
            onChange={(next) =>
              events.set(
                (events.data ?? []).map((e) =>
                  e.event_id === event.event_id ? { ...e, ...next } : e,
                ),
              )
            }
          />
        ))}
      </ul>
    </Screen>
  );
}

function EventCard({
  event,
  past,
  onChange,
}: {
  event: AppEvent;
  past: boolean;
  onChange: (next: Pick<AppEvent, 'attending_count' | 'my_registration'>) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const banner = event.event_images?.[0];
  const full = !!event.capacity && event.attending_count >= event.capacity;

  const register = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await appFetch<{ attending_count: number; my_registration: boolean }>(
        `/api/events/${event.event_id}/register`,
        { method: 'POST' },
      );
      onChange(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not register you');
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="relative h-32 bg-gradient-to-br from-accent to-app-pink">
        {banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
        {event.event_avenue && (
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-accent backdrop-blur-sm">
            {event.event_avenue}
          </span>
        )}
      </div>

      <div className="p-4">
        <h2 className="text-[17px] leading-snug font-bold text-app-plum">{event.event_name}</h2>

        {event.event_description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-app-plum/60">
            {event.event_description}
          </p>
        )}

        <dl className="mt-3 space-y-1.5 text-sm text-app-plum/55">
          <div className="flex items-center gap-2">
            <CalendarDays size={15} className="shrink-0 text-app-plum/35" aria-hidden />
            <dd>
              <time dateTime={event.event_date}>{formatDate(event.event_date)}</time>
              {event.event_time && <span className="text-app-plum/40"> · {event.event_time}</span>}
            </dd>
          </div>
          {event.event_place && (
            <div className="flex items-center gap-2">
              <MapPin size={15} className="shrink-0 text-app-plum/35" aria-hidden />
              <dd className="truncate">{event.event_place}</dd>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users size={15} className="shrink-0 text-app-plum/35" aria-hidden />
            <dd>
              {event.attending_count} {past ? 'attended' : 'attending'}
              {event.capacity ? ` of ${event.capacity}` : ''}
            </dd>
          </div>
        </dl>

        {error && (
          <p role="alert" className="mt-3 text-sm text-accent">
            {error}
          </p>
        )}

        <div className="mt-4 flex items-end justify-between gap-3">
          {event.members ? (
            <div className="flex min-w-0 items-center gap-2">
              <Avatar name={event.members.full_name} src={event.members.avatar_url} size={26} />
              <span className="truncate text-xs text-app-plum/50">
                Led by{' '}
                <span className="font-semibold text-app-plum/75">{event.members.full_name}</span>
              </span>
            </div>
          ) : (
            <span />
          )}

          {/* The button exists only while the admin has registration switched on. */}
          {event.registration_enabled && !past && (
            <button
              type="button"
              onClick={register}
              disabled={busy || event.my_registration || full}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                event.my_registration
                  ? 'bg-app-plum/5 text-app-plum/55'
                  : 'bg-accent text-white hover:bg-accent-light disabled:opacity-60'
              }`}
            >
              {busy && <Loader2 size={15} className="animate-spin" aria-hidden />}
              {event.my_registration && <Check size={15} aria-hidden />}
              {event.my_registration ? 'Registered' : full ? 'Full' : 'Register'}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
