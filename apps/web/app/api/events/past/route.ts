import { supabase } from '../../lib/supabase';
import { json, handleError } from '../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('events')
      .select(`
        event_id,
        event_name,
        event_date,
        event_place,
        event_strength,
        event_avenue,
        event_images,
        event_best_member,
        members!event_lead_id (
          member_id,
          full_name,
          avatar_url
        ),
        best_member:members!event_best_member (
          member_id,
          full_name,
          avatar_url
        ),
        fomo (
          fomo_id,
          category,
          images
        )
      `)
      .lt('event_date', today)
      .order('event_date', { ascending: false });

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data));
  } catch (err) {
    return handleError(err);
  }
}
