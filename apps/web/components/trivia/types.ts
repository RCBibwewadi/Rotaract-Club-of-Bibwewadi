import type { TriviaPhase } from '@rcb-2.0/shared';

export interface TriviaQuestion {
  id: string;
  phase: TriviaPhase;
  position: number;
  prompt: string;
  media_url: string | null;
  media_start: number | null;
  media_end: number | null;
  options: string[];
  answer_index: number;
  points: number;
}

export const PHASE_META: Record<TriviaPhase, { title: string; tagline: string; emoji: string }> = {
  quick: { title: 'Quick Quiz', tagline: 'Fast questions, faster answers', emoji: '⚡' },
  image: { title: 'Picture Abhi Baaki Hai', tagline: 'Name it from a single frame', emoji: '🎞️' },
  video: { title: 'Lights, Camera, Clip!', tagline: 'Watch closely', emoji: '🎬' },
  song: { title: 'Guess the Song', tagline: 'Ears only — no peeking', emoji: '🎵' },
};

/** Pulls the video id out of any common YouTube URL shape. */
export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}
