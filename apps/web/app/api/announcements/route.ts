import { NextRequest } from 'next/server';
import { supabase } from '../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  requireAdminPassword,
  handleError,
} from '../lib/middleware';
import { successResponse, errorResponse, fromZodError } from '@rcb-2.0/shared';
import { z, ZodError } from 'zod';

const CreateAnnouncementSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  body: z.string().trim().max(5000).default(''),
  image_url: z.string().url().max(1000).nullable().optional(),
});

const SELECT = `
  announcement_id,
  title,
  body,
  image_url,
  created_at,
  members (
    member_id,
    full_name,
    avatar_url
  )
`;

export async function GET(request: NextRequest) {
  try {
    const user = authenticate(request);
    // Admin tokens carry no membership, so they skip the approval check: the
    // admin section of the app reads this same list to manage it.
    if (user.role !== 'admin') requireApproved(user);

    const { data, error } = await supabase
      .from('announcements')
      .select(SELECT)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data ?? []));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin-only: announcements are club notices, not member posts.
    requireAdminPassword(request);

    const raw = await request.json();
    let body;
    try {
      body = CreateAnnouncementSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title: body.title,
        body: body.body,
        image_url: body.image_url || null,
      })
      .select(SELECT)
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'Announcement posted'), 201);
  } catch (err) {
    return handleError(err);
  }
}
