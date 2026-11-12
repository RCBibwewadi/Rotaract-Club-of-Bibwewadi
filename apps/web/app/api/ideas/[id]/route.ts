import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../../lib/middleware';
import { IDEA_SELECT, shapeIdea, type RawIdea } from '../../lib/ideas';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = authenticate(request);
    requireApproved(user);
    const { id } = await params;

    const { data, error } = await supabase
      .from('ideas')
      .select(IDEA_SELECT)
      .eq('idea_id', id)
      .single();

    if (error || !data) {
      return json(errorResponse('NOT_FOUND', 'Idea not found'), 404);
    }

    return json(successResponse(shapeIdea(data as unknown as RawIdea, user.member_id)));
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = authenticate(request);
    requireApproved(user);
    const { id } = await params;

    // Scoped to the author so a member can only delete their own post; admins
    // manage content from the website's admin panel.
    const { data, error } = await supabase
      .from('ideas')
      .delete()
      .eq('idea_id', id)
      .eq('member_id', user.member_id)
      .select('idea_id')
      .maybeSingle();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }
    if (!data) {
      return json(errorResponse('NOT_FOUND', 'Idea not found'), 404);
    }

    return json(successResponse({ idea_id: id }, 'Idea deleted'));
  } catch (err) {
    return handleError(err);
  }
}
