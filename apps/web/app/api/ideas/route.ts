import { NextRequest, after } from 'next/server';
import { supabase } from '../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../lib/middleware';
import {
  CreateIdeaSchema,
  IDEA_SELECT,
  shapeIdea,
  type RawIdea,
} from '../lib/ideas';
import { notifyMembers } from '../lib/push';
import { successResponse, errorResponse, fromZodError } from '@rcb-2.0/shared';
import { ZodError } from 'zod';

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const user = authenticate(request);
    // An admin token carries no membership, so it skips the approval check:
    // the app's admin section moderates from this same list.
    if (user.role !== 'admin') requireApproved(user);

    const page = Math.max(0, Number(request.nextUrl.searchParams.get('page') ?? 0) || 0);
    const from = page * PAGE_SIZE;

    const { data, error } = await supabase
      .from('ideas')
      .select(IDEA_SELECT)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    const ideas = (data as unknown as RawIdea[]).map((row) => shapeIdea(row, user.member_id ?? ''));

    return json(successResponse({ ideas, page, has_more: ideas.length === PAGE_SIZE }));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    const raw = await request.json();
    let body;
    try {
      body = CreateIdeaSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { data, error } = await supabase
      .from('ideas')
      .insert({
        member_id: user.member_id,
        title: body.title,
        description: body.description,
        image_url: body.image_url || null,
        tag: body.tag,
      })
      .select(IDEA_SELECT)
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    // After the response: a slow push service must not delay the poster.
    after(() =>
      notifyMembers(
        {
          title: 'New in IdeaVerse',
          body: body.title,
          tab: 'ideas',
          url: '/app/ideas',
        },
        user.member_id,
      ),
    );

    return json(
      successResponse(shapeIdea(data as unknown as RawIdea, user.member_id), 'Idea posted'),
      201,
    );
  } catch (err) {
    return handleError(err);
  }
}
