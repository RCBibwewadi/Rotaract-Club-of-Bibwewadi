import { NextRequest } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { json, handleError } from '../../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ category: string }> },
) {
  try {
    const { category } = await params;

    const { data, error } = await supabase
      .from('fomo')
      .select(`
        fomo_id,
        category,
        name,
        description,
        thumbnail,
        images,
        videos,
        events (
          event_id,
          event_name,
          event_date
        )
      `)
      .eq('category', category)
      .order('name');

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data));
  } catch (err) {
    return handleError(err);
  }
}
