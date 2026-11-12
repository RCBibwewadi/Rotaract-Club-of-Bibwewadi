import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import { json, requireAdminPassword, handleError } from '../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

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
