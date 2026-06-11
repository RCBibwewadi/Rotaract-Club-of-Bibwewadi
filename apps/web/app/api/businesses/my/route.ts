import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

export async function GET(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('member_id', user.member_id)
      .order('business_name');

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data));
  } catch (err) {
    return handleError(err);
  }
}
