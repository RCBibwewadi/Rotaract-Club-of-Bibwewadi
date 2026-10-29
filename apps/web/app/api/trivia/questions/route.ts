import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../lib/supabase';
import { json, handleError } from '../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';
import { TRIVIA_COLUMNS, isTriviaUnlocked } from '../lib';

/** The whole question bank, in play order, for the projector screen. */
export async function GET(request: NextRequest) {
  try {
    if (!isTriviaUnlocked(request)) {
      return json(errorResponse('LOCKED', 'Enter the trivia password first'), 401);
    }

    const { data, error } = await supabaseAdmin
      .from('trivia_questions')
      .select(TRIVIA_COLUMNS)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }
    return json(successResponse(data || []));
  } catch (err) {
    return handleError(err);
  }
}
