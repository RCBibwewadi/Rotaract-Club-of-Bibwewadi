'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { TriviaQuestion } from './types';
import { youtubeId } from './types';

/** Image, YouTube clip, or audio-only YouTube clip (video hidden) for one question. */
export default function MediaBlock({ q }: { q: TriviaQuestion }) {
  const [playKey, setPlayKey] = useState(0);
  if (!q.media_url) return null;

  const ytId = youtubeId(q.media_url);
  const isVideoFile = /\.(mp4|webm|mov)(\?|$)/i.test(q.media_url);

  if (q.phase === 'image' || (!ytId && !isVideoFile)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={q.media_url} alt="" className="max-h-[48vh] max-w-full rounded-2xl border-4 border-amber-400/60 shadow-[0_0_60px_rgba(251,191,36,0.25)] object-contain" />
    );
  }

  const audioOnly = q.phase === 'song';
  const replay = (
    <button onClick={() => setPlayKey(k => k + 1)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-lg hover:bg-white/20">
      <RotateCcw size={18} /> Replay
    </button>
  );

  if (isVideoFile) {
    return (
      <div className="flex flex-col items-center">
        <video key={playKey} src={`${q.media_url}#t=${q.media_start ?? 0}${q.media_end ? `,${q.media_end}` : ''}`} autoPlay controls={!audioOnly}
          className={audioOnly ? 'hidden' : 'max-h-[48vh] rounded-2xl border-4 border-amber-400/60'} />
        {audioOnly && <Equaliser />}
        {replay}
      </div>
    );
  }

  const params = new URLSearchParams({ autoplay: '1', rel: '0', modestbranding: '1', controls: audioOnly ? '0' : '1' });
  if (q.media_start != null) params.set('start', String(q.media_start));
  if (q.media_end != null) params.set('end', String(q.media_end));
  const src = `https://www.youtube.com/embed/${ytId}?${params}`;

  return (
    <div className="flex flex-col items-center">
      {audioOnly ? (
        <>
          {/* The player still has to exist to make sound; it's just invisible. */}
          <iframe key={playKey} src={src} allow="autoplay; encrypted-media" className="pointer-events-none absolute h-48 w-80 opacity-0" title="song" />
          <Equaliser />
        </>
      ) : (
        <iframe key={playKey} src={src} allow="autoplay; encrypted-media; fullscreen" allowFullScreen title="clip"
          className="aspect-video h-[48vh] max-w-full rounded-2xl border-4 border-amber-400/60" />
      )}
      {replay}
    </div>
  );
}

function Equaliser() {
  return (
    <div className="flex h-40 items-end gap-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className="w-6 rounded-t-lg bg-gradient-to-t from-fuchsia-600 to-amber-300 animate-[trivia-eq_1s_ease-in-out_infinite]"
          style={{ animationDelay: `${(i * 137) % 800}ms`, height: '30%' }} />
      ))}
    </div>
  );
}
