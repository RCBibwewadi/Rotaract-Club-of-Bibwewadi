import { NextRequest } from 'next/server';
import { supabase } from '../../../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../../../lib/middleware';
import { CreateCommentSchema } from '../../../lib/ideas';
import { successResponse, errorResponse, fromZodError } from '@rcb-2.0/shared';
import { ZodError } from 'zod';

const COMMENT_SELECT = `
  comment_id,
  body,
  created_at,
  members!idea_comments_member_id_fkey (
    member_id,
    full_name,
    avatar_url
  )
`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = authenticate(request);
    // Admin tokens carry no membership; the app's admin section reads this.
    if (user.role !== 'admin') requireApproved(user);
    const { id } = await params;

    const { data, error } = await supabase
      .from('idea_comments')
      .select(COMMENT_SELECT)
      .eq('idea_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data ?? []));
  } catch (err) {
    return handleError(err);
  }
}

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
      body = CreateCommentSchema.parse(raw);
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

    const { data, error } = await supabase
      .from('idea_comments')
      .insert({ idea_id: id, member_id: user.member_id, body: body.body })
      .select(COMMENT_SELECT)
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'Comment added'), 201);
  } catch (err) {
    return handleError(err);
  }
}
