'use client';

import { useState } from 'react';
import { ChevronDown, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { timeAgo, useResource, ApiError } from '@/lib/app/client';
import { adminFetch } from '@/lib/app/admin';
import type { Idea, IdeaComment, IdeaFeed } from '@/lib/app/types';
import { Loading, ErrorState, EmptyState, Avatar } from '@/components/app/Screen';
import AdminScreen, { NoticeBanner, useNotice } from '@/components/app/AdminScreen';

export default function AdminIdeasPage() {
  const feed = useResource<IdeaFeed>('/api/ideas', adminFetch);
  const [notice, showNotice] = useNotice();
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const removeIdea = async (idea: Idea) => {
    if (!window.confirm(`Delete "${idea.title}"? Its comments and votes go with it.`)) return;
    setBusy(idea.idea_id);
    try {
      await adminFetch(`/api/ideas/${idea.idea_id}`, { method: 'DELETE' });
      if (feed.data) {
        feed.set({
          ...feed.data,
          ideas: feed.data.ideas.filter((i) => i.idea_id !== idea.idea_id),
        });
      }
      showNotice('Idea deleted', 'success');
    } catch (err) {
      showNotice(err instanceof ApiError ? err.message : 'Delete failed', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminScreen title="IdeaVerse">
      <NoticeBanner notice={notice} />

      {feed.loading && <Loading label="Loading ideas" />}
      {feed.error && <ErrorState message={feed.error} onRetry={feed.reload} />}

      {feed.data?.ideas.length === 0 && (
        <EmptyState title="No ideas yet" body="Member posts appear here for moderation." />
      )}

      <ul className="space-y-3">
        {feed.data?.ideas.map((idea) => (
          <li key={idea.idea_id} className="rounded-2xl bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[16px] leading-snug font-bold text-app-plum">{idea.title}</h2>
                <p className="mt-1 truncate text-xs text-app-plum/45">
                  {idea.author?.full_name ?? 'Former member'} · {timeAgo(idea.created_at)} ·{' '}
                  {idea.score} {Math.abs(idea.score) === 1 ? 'vote' : 'votes'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeIdea(idea)}
                disabled={busy === idea.idea_id}
                aria-label={`Delete ${idea.title}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/5 text-accent disabled:opacity-50"
              >
                {busy === idea.idea_id ? (
                  <Loader2 size={15} className="animate-spin" aria-hidden />
                ) : (
                  <Trash2 size={15} aria-hidden />
                )}
              </button>
            </div>

            {idea.description && (
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-app-plum/60">
                {idea.description}
              </p>
            )}

            <button
              type="button"
              onClick={() => setOpen(open === idea.idea_id ? null : idea.idea_id)}
              aria-expanded={open === idea.idea_id}
              className="mt-3 flex items-center gap-1.5 rounded-full bg-app-plum/5 px-3 py-1.5 text-xs font-semibold text-app-plum/60"
            >
              <MessageSquare size={13} aria-hidden />
              {idea.comment_count} {idea.comment_count === 1 ? 'comment' : 'comments'}
              <ChevronDown
                size={13}
                aria-hidden
                className={open === idea.idea_id ? 'rotate-180' : ''}
              />
            </button>

            {open === idea.idea_id && (
              <Conversation ideaId={idea.idea_id} onNotice={showNotice} />
            )}
          </li>
        ))}
      </ul>
    </AdminScreen>
  );
}

/** The idea's comments, each removable. Loaded only when the admin opens it. */
function Conversation({
  ideaId,
  onNotice,
}: {
  ideaId: string;
  onNotice: (text: string, type: 'success' | 'error') => void;
}) {
  const comments = useResource<IdeaComment[]>(`/api/ideas/${ideaId}/comments`, adminFetch);
  const [busy, setBusy] = useState<string | null>(null);

  const remove = async (comment: IdeaComment) => {
    if (!window.confirm('Delete this comment?')) return;
    setBusy(comment.comment_id);
    try {
      await adminFetch(`/api/ideas/${ideaId}/comments/${comment.comment_id}`, {
        method: 'DELETE',
      });
      comments.set((comments.data ?? []).filter((c) => c.comment_id !== comment.comment_id));
      onNotice('Comment deleted', 'success');
    } catch (err) {
      onNotice(err instanceof ApiError ? err.message : 'Delete failed', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-3 border-t border-black/5 pt-3">
      {comments.loading && <Loading label="Loading comments" />}
      {comments.error && <ErrorState message={comments.error} onRetry={comments.reload} />}

      {comments.data?.length === 0 && (
        <p className="text-sm text-app-plum/40">No comments on this idea.</p>
      )}

      <ul className="space-y-2.5">
        {comments.data?.map((comment) => (
          <li key={comment.comment_id} className="flex items-start gap-2.5">
            <Avatar
              name={comment.members?.full_name ?? 'Member'}
              src={comment.members?.avatar_url}
              size={26}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-app-plum">
                {comment.members?.full_name ?? 'Former member'}
                <span className="ml-1.5 font-normal text-app-plum/35">
                  {timeAgo(comment.created_at)}
                </span>
              </p>
              <p className="mt-0.5 text-sm leading-relaxed whitespace-pre-line text-app-plum/70">
                {comment.body}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(comment)}
              disabled={busy === comment.comment_id}
              aria-label="Delete comment"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/5 text-accent disabled:opacity-50"
            >
              {busy === comment.comment_id ? (
                <Loader2 size={13} className="animate-spin" aria-hidden />
              ) : (
                <Trash2 size={13} aria-hidden />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
