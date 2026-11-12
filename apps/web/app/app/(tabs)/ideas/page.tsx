'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus } from 'lucide-react';
import { appFetch, useResource } from '@/lib/app/client';
import type { Idea, IdeaFeed } from '@/lib/app/types';
import { Screen, Loading, ErrorState, EmptyState } from '@/components/app/Screen';
import IdeaCard from '@/components/app/IdeaCard';

export default function IdeasPage() {
  const feed = useResource<IdeaFeed>('/api/ideas');
  const [loadingMore, setLoadingMore] = useState(false);

  const patch = (ideaId: string, next: Pick<Idea, 'score' | 'my_vote'>) => {
    if (!feed.data) return;
    feed.set({
      ...feed.data,
      ideas: feed.data.ideas.map((idea) => (idea.idea_id === ideaId ? { ...idea, ...next } : idea)),
    });
  };

  const loadMore = async () => {
    if (!feed.data || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = await appFetch<IdeaFeed>(`/api/ideas?page=${feed.data.page + 1}`);
      feed.set({ ...next, ideas: [...feed.data.ideas, ...next.ideas] });
    } catch {
      // Leave the list as it is; the button stays available for another try.
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <Screen
      title="Ideas"
      subtitle="What the club is thinking about"
      action={
        <Link
          href="/app/ideas/new"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-app-pink px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={16} aria-hidden />
          New
        </Link>
      }
    >
      {feed.loading && <Loading label="Loading ideas" />}

      {feed.error && <ErrorState message={feed.error} onRetry={feed.reload} />}

      {feed.data && feed.data.ideas.length === 0 && (
        <EmptyState
          title="No ideas yet"
          body="Be the first to pitch something — a project, a fundraiser, anything the club should try."
          action={
            <Link
              href="/app/ideas/new"
              className="inline-flex rounded-full bg-app-pink px-5 py-2.5 text-sm font-semibold text-white"
            >
              Share an idea
            </Link>
          }
        />
      )}

      {feed.data && feed.data.ideas.length > 0 && (
        <>
          <ul className="space-y-3">
            {feed.data.ideas.map((idea) => (
              <li key={idea.idea_id}>
                <IdeaCard idea={idea} onChange={(next) => patch(idea.idea_id, next)} />
              </li>
            ))}
          </ul>

          {feed.data.has_more && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-semibold text-app-plum/70 disabled:opacity-60"
            >
              {loadingMore && <Loader2 size={16} className="animate-spin" aria-hidden />}
              {loadingMore ? 'Loading' : 'Load older ideas'}
            </button>
          )}
        </>
      )}
    </Screen>
  );
}
