import { NextRequest } from 'next/server';
import { supabase } from '../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

export async function GET(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    const { data, error } = await supabase
      .from('members')
      .select(`
        member_id,
        full_name,
        email,
        phone,
        avatar_url,
        member_type,
        years_in_rcb,
        businesses (*),
        professions (*),
        member_visibility (*)
      `)
      .eq('is_active', true)
      .eq('is_approved', true)
      .neq('member_id', user.member_id)
      .order('created_at', { ascending: true });

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data));
  } catch (err) {
    return handleError(err);
  }
}
