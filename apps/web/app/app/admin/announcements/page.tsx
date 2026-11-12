'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { timeAgo, useResource, ApiError } from '@/lib/app/client';
import { adminFetch } from '@/lib/app/admin';
import type { Announcement } from '@/lib/app/types';
import { Loading, ErrorState, EmptyState } from '@/components/app/Screen';
import AdminScreen, { NoticeBanner, useNotice } from '@/components/app/AdminScreen';

const fieldClass =
  'w-full rounded-2xl border border-app-plum/10 bg-white px-4 py-3.5 text-[15px] text-app-plum ' +
  'placeholder-app-plum/30 outline-none transition-colors focus:border-app-pink';

export default function AdminAnnouncementsPage() {
  const notices = useResource<Announcement[]>('/api/announcements', adminFetch);
  const [notice, showNotice] = useNotice();
  const [composing, setComposing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const remove = async (item: Announcement) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    setDeleting(item.announcement_id);
    try {
      await adminFetch(`/api/announcements/${item.announcement_id}`, { method: 'DELETE' });
      notices.set((notices.data ?? []).filter((n) => n.announcement_id !== item.announcement_id));
      showNotice('Announcement deleted', 'success');
    } catch (err) {
      showNotice(err instanceof ApiError ? err.message : 'Delete failed', 'error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AdminScreen title="Announcements">
      <NoticeBanner notice={notice} />

      <button
        type="button"
        onClick={() => setComposing(true)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-app-pink py-3.5 text-[15px] font-semibold text-white"
      >
        <Plus size={18} aria-hidden />
        New announcement
      </button>

      {notices.loading && <Loading label="Loading announcements" />}
      {notices.error && <ErrorState message={notices.error} onRetry={notices.reload} />}

      {notices.data?.length === 0 && (
        <EmptyState
          title="No announcements"
          body="Post one and every approved member sees it on their Announcements tab."
        />
      )}

      <ul className="space-y-3">
        {notices.data?.map((item) => (
          <li key={item.announcement_id} className="rounded-2xl bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-accent">{timeAgo(item.created_at)}</p>
                <h2 className="mt-1 text-[16px] leading-snug font-bold text-app-plum">
                  {item.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => remove(item)}
                disabled={deleting === item.announcement_id}
                aria-label={`Delete ${item.title}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/5 text-accent disabled:opacity-50"
              >
                {deleting === item.announcement_id ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                ) : (
                  <Trash2 size={16} aria-hidden />
                )}
              </button>
            </div>

            {item.body && (
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-app-plum/65">
                {item.body}
              </p>
            )}
            {item.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image_url}
                alt=""
                className="mt-3 max-h-48 w-full rounded-xl object-cover"
                loading="lazy"
              />
            )}
          </li>
        ))}
      </ul>

      {composing && (
        <ComposeSheet
          onClose={() => setComposing(false)}
          onPosted={(created) => {
            notices.set([created, ...(notices.data ?? [])]);
            setComposing(false);
            showNotice('Announcement posted', 'success');
          }}
        />
      )}
    </AdminScreen>
  );
}

function ComposeSheet({
  onClose,
  onPosted,
}: {
  onClose: () => void;
  onPosted: (created: Announcement) => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (posting) return;
    if (!title.trim()) {
      setError('A title is required');
      return;
    }

    setPosting(true);
    setError('');
    try {
      const created = await adminFetch<Announcement>('/api/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          image_url: imageUrl.trim() || null,
        }),
      });
      onPosted(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not post the announcement');
      setPosting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="New announcement"
    >
      <form
        onSubmit={submit}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-app-panel p-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-app-plum">New announcement</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-app-plum/40">
            <X size={20} aria-hidden />
          </button>
        </div>

        <label htmlFor="title" className="mt-5 mb-1.5 block text-sm font-medium text-app-plum/70">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Club meeting moved to Saturday"
          className={fieldClass}
        />

        <label htmlFor="body" className="mt-4 mb-1.5 block text-sm font-medium text-app-plum/70">
          Details
        </label>
        <textarea
          id="body"
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
          placeholder="What do members need to know?"
          className={`${fieldClass} resize-none`}
        />

        <label htmlFor="image" className="mt-4 mb-1.5 block text-sm font-medium text-app-plum/70">
          Image URL <span className="font-normal text-app-plum/40">(optional)</span>
        </label>
        <input
          id="image"
          type="url"
          inputMode="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
          className={fieldClass}
        />

        {error && (
          <p role="alert" className="mt-4 text-sm text-accent">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={posting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-app-pink py-4 text-base font-semibold text-white disabled:opacity-60"
        >
          {posting && <Loader2 size={18} className="animate-spin" aria-hidden />}
          {posting ? 'Posting' : 'Post announcement'}
        </button>
      </form>
    </div>
  );
}
