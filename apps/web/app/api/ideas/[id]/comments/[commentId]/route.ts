import { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../../../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

/**
 * Removes a comment. Its author may take back what they wrote; an admin may
 * remove anyone's, which is how a conversation is moderated.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const user = authenticate(request);
    const isAdmin = user.role === 'admin';
    if (!isAdmin) requireApproved(user);
    const { id, commentId } = await params;

    const query = supabase
      .from('idea_comments')
      .delete()
      .eq('comment_id', commentId)
      .eq('idea_id', id);

    const { data, error } = await (isAdmin ? query : query.eq('member_id', user.member_id))
      .select('comment_id')
      .maybeSingle();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }
    if (!data) {
      return json(errorResponse('NOT_FOUND', 'Comment not found'), 404);
    }

    return json(successResponse({ comment_id: commentId }, 'Comment deleted'));
  } catch (err) {
    return handleError(err);
  }
}
