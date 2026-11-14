import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../../lib/middleware';
import { IDEA_SELECT, UpdateIdeaSchema, shapeIdea, type RawIdea } from '../../lib/ideas';
import { successResponse, errorResponse, fromZodError } from '@rcb-2.0/shared';
import { ZodError } from 'zod';

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = authenticate(request);
    requireApproved(user);
    const { id } = await params;

    let body: { description: string };
    try {
      body = UpdateIdeaSchema.parse(await request.json());
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    // Scoped to the author, so another member's post cannot be rewritten.
    const { data, error } = await supabase
      .from('ideas')
      .update(body)
      .eq('idea_id', id)
      .eq('member_id', user.member_id)
      .select(IDEA_SELECT)
      .maybeSingle();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }
    if (!data) {
      return json(errorResponse('NOT_FOUND', 'Idea not found'), 404);
    }

    return json(
      successResponse(shapeIdea(data as unknown as RawIdea, user.member_id), 'Idea updated'),
    );
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
    const isAdmin = user.role === 'admin';
    if (!isAdmin) requireApproved(user);
    const { id } = await params;

    // A member may delete only their own post; an admin moderates any of them.
    const query = supabase.from('ideas').delete().eq('idea_id', id);
    const { data, error } = await (isAdmin ? query : query.eq('member_id', user.member_id))
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
