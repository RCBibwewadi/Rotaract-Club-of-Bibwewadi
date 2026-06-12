import { supabase } from '../../lib/supabase';
import { json, handleError } from '../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

const BOD_SELECT = `
  bod_id, full_name, designation, linkedin_url, instagram_url,
  gmail, avatar_url, description, riy_year, is_current, sort_order
`;

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('bod')
      .select(BOD_SELECT)
      .eq('is_current', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data));
  } catch (err) {
    return handleError(err);
  }
}
