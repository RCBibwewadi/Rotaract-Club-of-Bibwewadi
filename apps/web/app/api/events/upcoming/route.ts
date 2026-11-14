import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import { json, handleError, optionalMember } from '../../lib/middleware';
import { APP_EVENT_COLUMNS, shapeEventCounts } from '../../lib/events';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('events')
      .select(`
        event_id,
        event_name,
        event_date,
        event_time,
        event_place,
        open_to_all,
        event_avenue,
        event_description,
        event_images,
        event_best_member,
        ${APP_EVENT_COLUMNS},
        members!event_lead_id (
          member_id,
          full_name,
          avatar_url
        ),
        best_member:members!event_best_member (
          member_id,
          full_name,
          avatar_url
        )
      `)
      .gte('event_date', today)
      .order('event_date', { ascending: true });

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    const viewer = optionalMember(request);
    return json(successResponse((data ?? []).map((row) => shapeEventCounts(row, viewer))));
  } catch (err) {
    return handleError(err);
  }
}
