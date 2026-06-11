import { NextRequest } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { json, requireAdminPassword, handleError } from '../../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireAdminPassword(request);
    const { id } = await params;

    const { member_id } = await request.json();

    if (!member_id) {
      return json(
        errorResponse('VALIDATION_ERROR', 'member_id is required'),
        400,
      );
    }

    const { data, error } = await supabase
      .from('events')
      .update({ event_best_member: member_id })
      .eq('event_id', id)
      .select(`
        event_id,
        event_name,
        best_member:members!event_best_member (
          member_id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'Best member awarded successfully'));
  } catch (err) {
    return handleError(err);
  }
}
