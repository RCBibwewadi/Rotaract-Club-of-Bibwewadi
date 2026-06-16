import { NextRequest } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { json, requireAdminPassword, handleError } from '../../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

export async function GET(request: NextRequest) {
  try {
    requireAdminPassword(request);

    const { data, error } = await supabase
      .from('members')
      .select('member_id, full_name, email, username, member_type, created_at, payment_method, payment_proof_url')
      .eq('is_approved', false)
      .eq('is_active', true)
      .eq('role', 'member')
      .order('created_at', { ascending: true });

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data));
  } catch (err) {
    return handleError(err);
  }
}
