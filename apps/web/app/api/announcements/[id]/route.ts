import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import { json, requireAdminPassword, handleError } from '../../lib/middleware';
import {
  ANNOUNCEMENT_SELECT,
  UpdateAnnouncementSchema,
} from '../../lib/announcements';
import { successResponse, errorResponse, fromZodError } from '@rcb-2.0/shared';
import { ZodError } from 'zod';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Admin-only, exactly like posting one: announcements are club notices.
    requireAdminPassword(request);
    const { id } = await params;

    let patch;
    try {
      patch = UpdateAnnouncementSchema.parse(await request.json());
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { data, error } = await supabase
      .from('announcements')
      .update({
        ...patch,
        ...(patch.image_url !== undefined ? { image_url: patch.image_url || null } : {}),
      })
      .eq('announcement_id', id)
      .select(ANNOUNCEMENT_SELECT)
      .maybeSingle();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }
    if (!data) {
      return json(errorResponse('NOT_FOUND', 'Announcement not found'), 404);
    }

    return json(successResponse(data, 'Announcement updated'));
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireAdminPassword(request);
    const { id } = await params;

    const { data, error } = await supabase
      .from('announcements')
      .delete()
      .eq('announcement_id', id)
      .select('announcement_id')
      .maybeSingle();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }
    if (!data) {
      return json(errorResponse('NOT_FOUND', 'Announcement not found'), 404);
    }

    return json(successResponse({ announcement_id: id }, 'Announcement deleted'));
  } catch (err) {
    return handleError(err);
  }
}
