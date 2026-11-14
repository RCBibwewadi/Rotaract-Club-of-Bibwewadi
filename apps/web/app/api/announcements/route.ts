import { NextRequest, after } from 'next/server';
import { supabase } from '../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  requireAdminPassword,
  handleError,
} from '../lib/middleware';
import {
  ANNOUNCEMENT_SELECT,
  CreateAnnouncementSchema,
} from '../lib/announcements';
import { notifyMembers } from '../lib/push';
import { successResponse, errorResponse, fromZodError } from '@rcb-2.0/shared';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const user = authenticate(request);
    // Admin tokens carry no membership, so they skip the approval check: the
    // admin section of the app reads this same list to manage it.
    if (user.role !== 'admin') requireApproved(user);

    const { data, error } = await supabase
      .from('announcements')
      .select(ANNOUNCEMENT_SELECT)
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
      .select(ANNOUNCEMENT_SELECT)
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    after(() =>
      notifyMembers({
        title: body.title,
        body: body.body.slice(0, 120),
        tab: 'announcements',
        url: '/app/announcements',
      }),
    );

    return json(successResponse(data, 'Announcement posted'), 201);
  } catch (err) {
    return handleError(err);
  }
}
