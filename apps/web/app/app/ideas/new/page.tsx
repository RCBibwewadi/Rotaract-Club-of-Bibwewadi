'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { appFetch, ApiError } from '@/lib/app/client';
import { IDEA_TAGS } from '@/app/api/lib/ideas';
import type { Idea } from '@/lib/app/types';

const fieldClass =
  'w-full rounded-2xl border border-app-plum/10 bg-white px-4 py-3.5 text-[15px] text-app-plum ' +
  'placeholder-app-plum/30 outline-none transition-colors focus:border-app-pink';

export default function NewIdeaPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState<(typeof IDEA_TAGS)[number]>('General');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (title.trim().length < 3) {
      setError('Give your idea a title of at least 3 characters');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const idea = await appFetch<Idea>('/api/ideas', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), description: description.trim(), tag }),
      });
      router.replace(`/app/ideas/${idea.idea_id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not post your idea');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-canvas">
      <header
        className="sticky top-0 z-30 flex items-center gap-3 border-b border-black/5 bg-app-canvas/90 px-4 pb-3 backdrop-blur-lg"
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
        <span className="text-base font-semibold text-app-plum">New idea</span>
      </header>

      <form
        onSubmit={submit}
        className="px-4 pt-5"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
        noValidate
      >
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-app-plum/70">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="A blood donation drive at the college"
          className={fieldClass}
        />

        <label htmlFor="description" className="mt-5 mb-1.5 block text-sm font-medium text-app-plum/70">
          Details
        </label>
        <textarea
          id="description"
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={5000}
          placeholder="What is the idea, who does it help, and what would it take?"
          className={`${fieldClass} resize-none`}
        />

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium text-app-plum/70">Topic</legend>
          <div className="flex flex-wrap gap-2">
            {IDEA_TAGS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTag(option)}
                aria-pressed={tag === option}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  tag === option
                    ? 'bg-app-plum text-white'
                    : 'bg-white text-app-plum/60 border border-app-plum/10'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="mt-5 text-sm text-accent">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-app-pink py-4 text-base font-semibold text-white disabled:opacity-60"
        >
          {submitting && <Loader2 size={18} className="animate-spin" aria-hidden />}
          {submitting ? 'Posting' : 'Post idea'}
        </button>
      </form>
    </div>
  );
}
