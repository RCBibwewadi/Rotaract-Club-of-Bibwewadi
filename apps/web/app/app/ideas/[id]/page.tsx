'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2, Pencil, RefreshCw, Send, X } from 'lucide-react';
import { appFetch, timeAgo, useResource, ApiError } from '@/lib/app/client';
import type { Idea, IdeaComment } from '@/lib/app/types';
import { Loading, ErrorState, Avatar } from '@/components/app/Screen';
import PullToRefresh, { refreshApp } from '@/components/app/PullToRefresh';
import { VoteControls } from '@/components/app/IdeaCard';
import { useAuthStore } from '@/lib/auth-store';

export default function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const idea = useResource<Idea>(`/api/ideas/${id}`);
  const comments = useResource<IdeaComment[]>(`/api/ideas/${id}/comments`);

  const myId = useAuthStore((state) => state.member?.member_id);
  const isAuthor = !!myId && idea.data?.author?.member_id === myId;

  // null = not editing; a string is the description being rewritten.
  const [edit, setEdit] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const saveDescription = async () => {
    if (edit === null || savingEdit) return;
    setSavingEdit(true);
    setEditError('');
    try {
      const updated = await appFetch<Idea>(`/api/ideas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ description: edit }),
      });
      idea.set(updated);
      setEdit(null);
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Could not save your changes');
    } finally {
      setSavingEdit(false);
    }
  };

  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || posting) return;

    setPosting(true);
    setPostError('');
    try {
      const comment = await appFetch<IdeaComment>(`/api/ideas/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      comments.set([...(comments.data ?? []), comment]);
      if (idea.data) idea.set({ ...idea.data, comment_count: idea.data.comment_count + 1 });
      setDraft('');
    } catch (err) {
      setPostError(err instanceof ApiError ? err.message : 'Could not post your comment');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="flex h-[100svh] flex-col overflow-hidden bg-app-canvas">
      <header
        className="shrink-0 flex items-center gap-3 border-b border-black/5 bg-app-canvas/90 px-4 pb-3 backdrop-blur-lg"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="-ml-1 rounded-full p-1.5 text-app-plum"
        >
          <ArrowLeft size={22} aria-hidden />
        </button>
        <span className="flex-1 text-base font-semibold text-app-plum">IdeaVerse</span>
        <button
          type="button"
          onClick={refreshApp}
          aria-label="Refresh"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-app-plum/5 text-app-plum/55"
        >
          <RefreshCw size={16} aria-hidden />
        </button>
      </header>

      <PullToRefresh className="flex-1 overflow-y-auto overscroll-contain">
        <main className="px-4 pt-4" style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))' }}>
          {idea.loading && <Loading label="Loading idea" />}
          {idea.error && <ErrorState message={idea.error} onRetry={idea.reload} />}

          {idea.data && (
            <>
              <article className="rounded-2xl bg-white p-5">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    name={idea.data.author?.full_name ?? 'Member'}
                    src={idea.data.author?.avatar_url}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-app-plum">
                      {idea.data.author?.full_name ?? 'Former member'}
                    </p>
                    <p className="text-xs text-app-plum/40">{timeAgo(idea.data.created_at)}</p>
                  </div>
                </div>

                <h1 className="mt-4 text-xl leading-snug font-bold text-app-plum">{idea.data.title}</h1>

                {edit !== null ? (
                  <>
                    <label htmlFor="description" className="sr-only">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={6}
                      value={edit}
                      maxLength={5000}
                      onChange={(e) => setEdit(e.target.value)}
                      placeholder="What is the idea, who does it help, and what would it take?"
                      className="mt-3 w-full resize-none rounded-2xl border border-app-plum/10 bg-app-canvas px-4 py-3 text-[15px] text-app-plum outline-none focus:border-app-pink"
                    />
                    {editError && (
                      <p role="alert" className="mt-2 text-sm text-accent">
                        {editError}
                      </p>
                    )}
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={saveDescription}
                        disabled={savingEdit}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-accent transition-colors hover:bg-accent-light py-3 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {savingEdit ? (
                          <Loader2 size={15} className="animate-spin" aria-hidden />
                        ) : (
                          <Check size={15} aria-hidden />
                        )}
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEdit(null)}
                        className="flex items-center justify-center gap-1.5 rounded-2xl bg-app-plum/5 px-5 text-sm font-medium text-app-plum/60"
                      >
                        <X size={14} aria-hidden />
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {idea.data.description && (
                      <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-app-plum/70">
                        {idea.data.description}
                      </p>
                    )}
                    {isAuthor && (
                      <button
                        type="button"
                        onClick={() => setEdit(idea.data?.description ?? '')}
                        className="mt-3 flex items-center gap-1.5 rounded-full bg-app-plum/5 px-3.5 py-2 text-sm font-medium text-app-plum/60"
                      >
                        <Pencil size={14} aria-hidden />
                        {idea.data.description ? 'Edit description' : 'Add a description'}
                      </button>
                    )}
                  </>
                )}
                {idea.data.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={idea.data.image_url} alt="" className="mt-4 w-full rounded-xl object-cover" />
                )}

                <div className="mt-4">
                  <VoteControls
                    idea={idea.data}
                    size="lg"
                    onChange={(next) => idea.data && idea.set({ ...idea.data, ...next })}
                  />
                </div>
              </article>

              <h2 className="mt-6 mb-3 px-1 text-sm font-semibold text-app-plum/60">
                {idea.data.comment_count === 1 ? '1 comment' : `${idea.data.comment_count} comments`}
              </h2>

              {comments.loading && <Loading label="Loading comments" />}
              {comments.error && <ErrorState message={comments.error} onRetry={comments.reload} />}

              {comments.data?.length === 0 && (
                <p className="rounded-2xl bg-white p-6 text-center text-sm text-app-plum/45">
                  No comments yet. Start the discussion.
                </p>
              )}

              <ul className="space-y-2.5">
                {comments.data?.map((comment) => (
                  <li key={comment.comment_id} className="rounded-2xl bg-white p-4">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={comment.members?.full_name ?? 'Member'}
                        src={comment.members?.avatar_url}
                        size={26}
                      />
                      <p className="truncate text-sm font-semibold text-app-plum">
                        {comment.members?.full_name ?? 'Former member'}
                      </p>
                      <span className="text-xs text-app-plum/35">{timeAgo(comment.created_at)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-app-plum/75">
                      {comment.body}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </main>
      </PullToRefresh>

      {idea.data && (
        <form
          onSubmit={submitComment}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 px-4 pt-3 backdrop-blur-xl"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
        >
          {postError && (
            <p role="alert" className="mb-2 text-sm text-accent">
              {postError}
            </p>
          )}
          <div className="flex items-end gap-2">
            <label htmlFor="comment" className="sr-only">
              Add a comment
            </label>
            <textarea
              id="comment"
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a comment…"
              className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-app-plum/10 bg-app-canvas px-4 py-3 text-[15px] text-app-plum outline-none focus:border-app-pink"
            />
            <button
              type="submit"
              disabled={posting || !draft.trim()}
              aria-label="Post comment"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent transition-colors hover:bg-accent-light text-white disabled:opacity-40"
            >
              {posting ? (
                <Loader2 size={18} className="animate-spin" aria-hidden />
              ) : (
                <Send size={18} aria-hidden />
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
