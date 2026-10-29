import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../lib/supabase';
import { json, requireAdminPassword, handleError } from '../../lib/middleware';
import { successResponse, errorResponse, TriviaQuestionSchema } from '@rcb-2.0/shared';
import { TRIVIA_COLUMNS } from '../../trivia/lib';

export async function GET(request: NextRequest) {
  try {
    requireAdminPassword(request);

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

export async function POST(request: NextRequest) {
  try {
    requireAdminPassword(request);

    const parsed = TriviaQuestionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return json(errorResponse('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid question'), 400);
    }

    const { data, error } = await supabaseAdmin
      .from('trivia_questions')
      .insert(parsed.data)
      .select(TRIVIA_COLUMNS)
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }
    return json(successResponse(data), 201);
  } catch (err) {
    return handleError(err);
  }
}
