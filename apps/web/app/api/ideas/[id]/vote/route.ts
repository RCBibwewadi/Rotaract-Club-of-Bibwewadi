import { NextRequest } from 'next/server';
import { supabase } from '../../../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../../../lib/middleware';
import { VoteSchema } from '../../../lib/ideas';
import { successResponse, errorResponse, fromZodError } from '@rcb-2.0/shared';
import { ZodError } from 'zod';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = authenticate(request);
    requireApproved(user);
    const { id } = await params;

    const raw = await request.json();
    let body;
    try {
      body = VoteSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { data: idea } = await supabase
      .from('ideas')
      .select('idea_id')
      .eq('idea_id', id)
      .maybeSingle();

    if (!idea) {
      return json(errorResponse('NOT_FOUND', 'Idea not found'), 404);
    }

    const write =
      body.value === 0
        ? supabase.from('idea_votes').delete().eq('idea_id', id).eq('member_id', user.member_id)
        : supabase
            .from('idea_votes')
            // The (idea_id, member_id) primary key makes this flip an existing
            // vote rather than adding a second one.
            .upsert(
              { idea_id: id, member_id: user.member_id, value: body.value },
              { onConflict: 'idea_id,member_id' },
            );

    const { error: writeError } = await write;
    if (writeError) {
      return json(errorResponse('DB_ERROR', writeError.message), 500);
    }

    const { data: votes, error: readError } = await supabase
      .from('idea_votes')
      .select('value')
      .eq('idea_id', id);

    if (readError) {
      return json(errorResponse('DB_ERROR', readError.message), 500);
    }

    const score = (votes ?? []).reduce((sum, v) => sum + (v.value as number), 0);

    return json(successResponse({ idea_id: id, score, my_vote: body.value }));
  } catch (err) {
    return handleError(err);
  }
}
