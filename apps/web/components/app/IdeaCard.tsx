'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowBigDown, ArrowBigUp, MessageSquare } from 'lucide-react';
import { appFetch, timeAgo } from '@/lib/app/client';
import type { Idea } from '@/lib/app/types';
import { Avatar } from './Screen';

/**
 * Vote control shared by the feed card and the post page. Votes apply
 * optimistically and roll back if the write fails, so tapping stays instant on
 * a phone connection.
 */
export function VoteControls({
  idea,
  onChange,
  size = 'sm',
}: {
  idea: Idea;
  onChange: (next: Pick<Idea, 'score' | 'my_vote'>) => void;
  size?: 'sm' | 'lg';
}) {
  const [busy, setBusy] = useState(false);
  const iconSize = size === 'lg' ? 24 : 20;

  const cast = async (direction: -1 | 1) => {
    if (busy) return;
    const value = idea.my_vote === direction ? 0 : direction;
    const previous = { score: idea.score, my_vote: idea.my_vote };

    onChange({ score: idea.score - idea.my_vote + value, my_vote: value });
    setBusy(true);
    try {
      const result = await appFetch<{ score: number; my_vote: -1 | 0 | 1 }>(
        `/api/ideas/${idea.idea_id}/vote`,
        { method: 'POST', body: JSON.stringify({ value }) },
      );
      onChange({ score: result.score, my_vote: result.my_vote });
    } catch {
      onChange(previous);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1 rounded-full border border-accent bg-app-plum/5 px-1 py-1">
      <button
        type="button"
        onClick={() => cast(1)}
        aria-label="Upvote"
        aria-pressed={idea.my_vote === 1}
        className={`rounded-full p-1 transition-colors ${
          idea.my_vote === 1 ? 'text-app-pink' : 'text-app-plum/45'
        }`}
      >
        <ArrowBigUp size={iconSize} fill={idea.my_vote === 1 ? 'currentColor' : 'none'} aria-hidden />
      </button>
      <span className="min-w-5 text-center text-sm font-semibold tabular-nums text-app-plum">
        {idea.score}
      </span>
      <button
        type="button"
        onClick={() => cast(-1)}
        aria-label="Downvote"
        aria-pressed={idea.my_vote === -1}
        className={`rounded-full p-1 transition-colors ${
          idea.my_vote === -1 ? 'text-accent' : 'text-app-plum/45'
        }`}
      >
        <ArrowBigDown size={iconSize} fill={idea.my_vote === -1 ? 'currentColor' : 'none'} aria-hidden />
      </button>
    </div>
  );
}

export default function IdeaCard({
  idea,
  onChange,
}: {
  idea: Idea;
  onChange: (next: Pick<Idea, 'score' | 'my_vote'>) => void;
}) {
  return (
    <article className="rounded-2xl border border-accent bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-2.5">
        <Avatar name={idea.author?.full_name ?? 'Member'} src={idea.author?.avatar_url} size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-app-plum">
            {idea.author?.full_name ?? 'Former member'}
          </p>
          <p className="text-xs text-app-plum/40">{timeAgo(idea.created_at)}</p>
        </div>
      </div>

      <Link href={`/app/ideas/${idea.idea_id}`} className="mt-3 block">
        <h2 className="text-[17px] leading-snug font-bold text-app-plum">{idea.title}</h2>
        {idea.description && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-app-plum/60">
            {idea.description}
          </p>
        )}
        {idea.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={idea.image_url}
            alt=""
            className="mt-3 max-h-64 w-full rounded-xl object-cover"
            loading="lazy"
          />
        )}
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <VoteControls idea={idea} onChange={onChange} />
        <Link
          href={`/app/ideas/${idea.idea_id}`}
          className="flex items-center gap-1.5 rounded-full border border-accent bg-app-plum/5 px-3 py-2 text-sm font-medium text-app-plum/60"
        >
          <MessageSquare size={16} aria-hidden />
          {idea.comment_count}
          <span className="sr-only"> comments</span>
        </Link>
      </div>
    </article>
  );
}
