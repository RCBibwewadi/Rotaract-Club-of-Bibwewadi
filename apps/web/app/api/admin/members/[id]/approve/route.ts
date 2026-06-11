import { NextRequest } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { json, requireAdminPassword, handleError } from '../../../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireAdminPassword(request);
    const { id } = await params;

    const { data, error } = await supabase
      .from('members')
      .update({ is_approved: true })
      .eq('member_id', id)
      .select('member_id, full_name, email')
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'Member approved successfully'));
  } catch (err) {
    return handleError(err);
  }
}
