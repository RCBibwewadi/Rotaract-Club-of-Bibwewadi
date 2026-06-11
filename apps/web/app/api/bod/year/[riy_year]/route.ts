import { NextRequest } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { json, handleError } from '../../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

const BOD_SELECT = `
  bod_id, full_name, designation, linkedin_url, instagram_url,
  gmail, avatar_url, description, riy_year, is_current
`;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ riy_year: string }> },
) {
  try {
    const { riy_year } = await params;

    const { data, error } = await supabase
      .from('bod')
      .select(BOD_SELECT)
      .eq('riy_year', riy_year)
      .order('designation');

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data));
  } catch (err) {
    return handleError(err);
  }
}
