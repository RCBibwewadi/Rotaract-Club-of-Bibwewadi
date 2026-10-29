import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@rcb-2.0/shared';
import { TRIVIA_COOKIE, TRIVIA_PASSWORD, isTriviaUnlocked } from '../lib';

export async function GET(request: NextRequest) {
  return NextResponse.json(successResponse({ unlocked: isTriviaUnlocked(request) }));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (body?.password !== TRIVIA_PASSWORD) {
    return NextResponse.json(errorResponse('WRONG_PASSWORD', 'Wrong password'), { status: 401 });
  }

  const res = NextResponse.json(successResponse({ unlocked: true }));
  res.cookies.set(TRIVIA_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
