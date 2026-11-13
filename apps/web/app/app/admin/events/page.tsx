'use client';

import { useState } from 'react';
import { CalendarDays, Film, ImageIcon, Loader2, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useResource, ApiError } from '@/lib/app/client';
import { adminFetch } from '@/lib/app/admin';
import { Loading, ErrorState, EmptyState } from '@/components/app/Screen';
import AdminScreen, { NoticeBanner, useNotice } from '@/components/app/AdminScreen';
import { EVENT_CATEGORIES, DEFAULT_EVENT_CATEGORY } from '@/app/api/lib/events';

interface AdminEvent {
  event_id: string;
  event_name: string;
  event_date: string | null;
  event_time: string | null;
  event_place: string | null;
  event_avenue: string | null;
  event_description: string | null;
  open_to_all: boolean;
  registration_enabled: boolean;
  event_images: string[] | null;
  event_videos: string[] | null;
}

type EventDraft = Omit<AdminEvent, 'event_id'>;

const EMPTY_DRAFT: EventDraft = {
  event_name: '',
  event_date: '',
  event_time: '',
  event_place: '',
  event_description: '',
  open_to_all: false,
  registration_enabled: false,
  // Events are club service unless the admin says otherwise.
  event_avenue: DEFAULT_EVENT_CATEGORY,
  event_images: [],
  event_videos: [],
};

const fieldClass =
  'w-full rounded-2xl border border-app-plum/10 bg-white px-4 py-3.5 text-[15px] text-app-plum ' +
  'placeholder-app-plum/30 outline-none transition-colors focus:border-app-pink';

const formatDate = (date: string | null) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date';

export default function AdminEventsPage() {
  const events = useResource<AdminEvent[]>('/api/events', adminFetch);
  const [notice, showNotice] = useNotice();
  const [editor, setEditor] = useState<{ event: AdminEvent | null } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const remove = async (event: AdminEvent) => {
    if (!window.confirm(`Delete "${event.event_name}"? This cannot be undone.`)) return;
    setBusy(event.event_id);
    try {
      await adminFetch(`/api/events/${event.event_id}`, { method: 'DELETE' });
      showNotice('Event deleted', 'success');
      events.reload();
    } catch (err) {
      showNotice(err instanceof ApiError ? err.message : 'Delete failed', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminScreen title="Events">
      <NoticeBanner notice={notice} />

      <button
        type="button"
        onClick={() => setEditor({ event: null })}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent transition-colors hover:bg-accent-light py-3.5 text-[15px] font-semibold text-white"
      >
        <Plus size={18} aria-hidden />
        New event
      </button>

      {events.loading && <Loading label="Loading events" />}
      {events.error && <ErrorState message={events.error} onRetry={events.reload} />}

      {events.data?.length === 0 && (
        <EmptyState title="No events" body="Add one and it appears on the website and in Schedule." />
      )}

      <ul className="space-y-3">
        {events.data?.map((event) => (
          <li key={event.event_id} className="rounded-2xl bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                  <CalendarDays size={13} aria-hidden />
                  {formatDate(event.event_date)}
                  {event.event_time && (
                    <span className="font-normal text-app-plum/40">{event.event_time}</span>
                  )}
                </p>
                <h2 className="mt-1 text-[16px] leading-snug font-bold text-app-plum">
                  {event.event_name}
                </h2>
                {event.event_place && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-app-plum/50">
                    <MapPin size={13} aria-hidden />
                    {event.event_place}
                  </p>
                )}
                <p className="mt-2 flex flex-wrap items-center gap-1.5">
                  {event.event_avenue && (
                    <span className="rounded-full bg-app-plum/5 px-2.5 py-1 text-[11px] font-semibold text-app-plum/60">
                      {event.event_avenue}
                    </span>
                  )}
                  {event.registration_enabled && (
                    <span className="rounded-full bg-accent/8 px-2.5 py-1 text-[11px] font-semibold text-accent">
                      Registration open
                    </span>
                  )}
                </p>
              </div>

              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditor({ event })}
                  aria-label={`Edit ${event.event_name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-app-plum/5 text-app-plum/60"
                >
                  <Pencil size={15} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => remove(event)}
                  disabled={busy === event.event_id}
                  aria-label={`Delete ${event.event_name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/5 text-accent disabled:opacity-50"
                >
                  {busy === event.event_id ? (
                    <Loader2 size={15} className="animate-spin" aria-hidden />
                  ) : (
                    <Trash2 size={15} aria-hidden />
                  )}
                </button>
              </div>
            </div>

            {event.event_description && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-app-plum/60">
                {event.event_description}
              </p>
            )}
          </li>
        ))}
      </ul>

      {editor && (
        <EventSheet
          event={editor.event}
          onClose={() => setEditor(null)}
          onSaved={(message) => {
            setEditor(null);
            showNotice(message, 'success');
            events.reload();
          }}
        />
      )}
    </AdminScreen>
  );
}

function EventSheet({
  event,
  onClose,
  onSaved,
}: {
  event: AdminEvent | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [draft, setDraft] = useState<EventDraft>(
    event
      ? {
          event_name: event.event_name,
          event_date: event.event_date ?? '',
          event_time: event.event_time ?? '',
          event_place: event.event_place ?? '',
          event_avenue: event.event_avenue ?? '',
          event_description: event.event_description ?? '',
          open_to_all: event.open_to_all,
          registration_enabled: event.registration_enabled ?? false,
          event_images: event.event_images ?? [],
          event_videos: event.event_videos ?? [],
        }
      : EMPTY_DRAFT,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!draft.event_name.trim()) {
      setError('An event name is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await adminFetch(event ? `/api/events/${event.event_id}` : '/api/events', {
        method: event ? 'PATCH' : 'POST',
        body: JSON.stringify({
          ...draft,
          event_name: draft.event_name.trim(),
          // The API treats these as optional; empty strings would be stored.
          event_date: draft.event_date || undefined,
          event_time: draft.event_time || undefined,
          event_place: draft.event_place || undefined,
          event_description: draft.event_description || undefined,
        }),
      });
      onSaved(event ? 'Event updated' : 'Event created');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the event');
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={event ? 'Edit event' : 'New event'}
    >
      <form
        onSubmit={submit}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-app-panel p-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-app-plum">{event ? 'Edit event' : 'New event'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-app-plum/40">
            <X size={20} aria-hidden />
          </button>
        </div>

        <label htmlFor="event_name" className="mt-5 mb-1.5 block text-sm font-medium text-app-plum/70">
          Name
        </label>
        <input
          id="event_name"
          value={draft.event_name}
          onChange={(e) => set('event_name', e.target.value)}
          placeholder="Blood donation drive"
          className={fieldClass}
        />

        <div className="mt-4 flex gap-3">
          <div className="flex-1">
            <label htmlFor="event_date" className="mb-1.5 block text-sm font-medium text-app-plum/70">
              Date
            </label>
            <input
              id="event_date"
              type="date"
              value={draft.event_date ?? ''}
              onChange={(e) => set('event_date', e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="event_time" className="mb-1.5 block text-sm font-medium text-app-plum/70">
              Time
            </label>
            <input
              id="event_time"
              type="time"
              value={draft.event_time ?? ''}
              onChange={(e) => set('event_time', e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <label htmlFor="event_place" className="mt-4 mb-1.5 block text-sm font-medium text-app-plum/70">
          Place
        </label>
        <input
          id="event_place"
          value={draft.event_place ?? ''}
          onChange={(e) => set('event_place', e.target.value)}
          placeholder="Bibwewadi, Pune"
          className={fieldClass}
        />

        <label htmlFor="event_avenue" className="mt-4 mb-1.5 block text-sm font-medium text-app-plum/70">
          Category
        </label>
        <select
          id="event_avenue"
          value={draft.event_avenue ?? DEFAULT_EVENT_CATEGORY}
          onChange={(e) => set('event_avenue', e.target.value)}
          className={fieldClass}
        >
          {EVENT_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          {/* An event created on the website may carry an older avenue. */}
          {draft.event_avenue &&
            !EVENT_CATEGORIES.includes(
              draft.event_avenue as (typeof EVENT_CATEGORIES)[number],
            ) && <option value={draft.event_avenue}>{draft.event_avenue}</option>}
        </select>

        <label
          htmlFor="event_description"
          className="mt-4 mb-1.5 block text-sm font-medium text-app-plum/70"
        >
          Description
        </label>
        <textarea
          id="event_description"
          rows={4}
          value={draft.event_description ?? ''}
          onChange={(e) => set('event_description', e.target.value)}
          className={`${fieldClass} resize-none`}
        />

        <MediaField
          label="Banner image"
          icon={ImageIcon}
          accept="image/*"
          folder="avatars"
          value={draft.event_images?.[0] ?? ''}
          onChange={(url) => set('event_images', url ? [url] : [])}
        />

        <MediaField
          label="Video"
          icon={Film}
          accept="video/*"
          folder="videos"
          value={draft.event_videos?.[0] ?? ''}
          onChange={(url) => set('event_videos', url ? [url] : [])}
        />

        <label className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5">
          <input
            type="checkbox"
            checked={draft.open_to_all}
            onChange={(e) => set('open_to_all', e.target.checked)}
            className="h-5 w-5 accent-[#e8456f]"
          />
          <span className="text-[15px] text-app-plum/75">Open to all</span>
        </label>

        <label className="mt-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5">
          <input
            type="checkbox"
            checked={draft.registration_enabled}
            onChange={(e) => set('registration_enabled', e.target.checked)}
            className="h-5 w-5 accent-[#8b1a2b]"
          />
          <span className="text-[15px] text-app-plum/75">
            Registration enabled
            <span className="block text-xs text-app-plum/45">
              Shows a Register button on the event in the app.
            </span>
          </span>
        </label>

        {error && (
          <p role="alert" className="mt-4 text-sm text-accent">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent transition-colors hover:bg-accent-light py-4 text-base font-semibold text-white disabled:opacity-60"
        >
          {saving && <Loader2 size={18} className="animate-spin" aria-hidden />}
          {saving ? 'Saving' : event ? 'Save changes' : 'Create event'}
        </button>

        {/* The event lead and the best-member award still live on the website's
            admin panel: both need a member picker this sheet does not carry. */}
        <p className="mt-4 text-center text-xs text-app-plum/40">
          Event lead and awards are managed on the website admin panel.
        </p>
      </form>
    </div>
  );
}

/**
 * One uploaded file — the event's banner or its video. The upload happens as
 * soon as a file is picked, so the form only ever holds the stored URL.
 */
function MediaField({
  label,
  icon: Icon,
  accept,
  folder,
  value,
  onChange,
}: {
  label: string;
  icon: typeof ImageIcon;
  accept: string;
  folder: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File) => {
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const { url } = await adminFetch<{ url: string }>(`/api/upload?folder=${folder}`, {
        method: 'POST',
        body,
      });
      onChange(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4">
      <p className="mb-1.5 text-sm font-medium text-app-plum/70">{label}</p>

      {value && (
        <div className="mb-2 flex items-center gap-2 rounded-2xl bg-white px-4 py-3">
          <Icon size={16} className="shrink-0 text-app-plum/40" aria-hidden />
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate text-sm text-app-plum/60"
          >
            {value.split('/').pop()}
          </a>
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label={`Remove ${label.toLowerCase()}`}
            className="shrink-0 text-accent"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      )}

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-app-plum/20 bg-white py-3.5 text-sm font-medium text-app-plum/60">
        {busy ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <Icon size={16} aria-hidden />
        )}
        {busy ? 'Uploading' : value ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
        <input
          type="file"
          accept={accept}
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = '';
          }}
        />
      </label>

      {error && (
        <p role="alert" className="mt-1.5 text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
