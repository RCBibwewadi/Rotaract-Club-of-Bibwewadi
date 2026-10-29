import { NextRequest } from 'next/server';

// Deliberately basic gate: one shared password, remembered in a cookie.
export const TRIVIA_COOKIE = 'trivia_ok';
export const TRIVIA_PASSWORD = process.env.TRIVIA_PASSWORD || 'rotaracttrivia';

export function isTriviaUnlocked(request: NextRequest) {
  return request.cookies.get(TRIVIA_COOKIE)?.value === '1';
}

export const TRIVIA_COLUMNS =
  'id, phase, position, prompt, media_url, media_start, media_end, options, answer_index, points';
