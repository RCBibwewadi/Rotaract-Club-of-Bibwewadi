import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = authenticate(request);
    requireApproved(user);
    const { id } = await params;

    const { data, error } = await supabase
      .from('members')
      .select(`
        member_id,
        full_name,
        avatar_url,
        member_type,
        years_in_rcb,
        interests,
        businesses (*),
        professions (*),
        member_visibility (*)
      `)
      .eq('member_id', id)
      .eq('is_active', true)
      .eq('is_approved', true)
      .single();

    if (error) {
      return json(errorResponse('NOT_FOUND', 'Member not found'), 404);
    }

    return json(successResponse(data));
  } catch (err) {
    return handleError(err);
  }
}
