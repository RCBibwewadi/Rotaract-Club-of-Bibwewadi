import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';
import { json, requireAdminPassword, handleError } from '../../../lib/middleware';
import { successResponse, errorResponse, TriviaQuestionSchema } from '@rcb-2.0/shared';
import { TRIVIA_COLUMNS } from '../../../trivia/lib';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    requireAdminPassword(request);
    const { id } = await params;

    const parsed = TriviaQuestionSchema.partial().safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return json(errorResponse('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid question'), 400);
    }

    const { data, error } = await supabaseAdmin
      .from('trivia_questions')
      .update(parsed.data)
      .eq('id', id)
      .select(TRIVIA_COLUMNS)
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }
    return json(successResponse(data));
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    requireAdminPassword(request);
    const { id } = await params;

    const { error } = await supabaseAdmin.from('trivia_questions').delete().eq('id', id);
    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }
    return json(successResponse({ id }));
  } catch (err) {
    return handleError(err);
  }
}
