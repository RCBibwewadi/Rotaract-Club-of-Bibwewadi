import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { json, requireAdminPassword, handleError } from '../../../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

/** Flip the payment_verified flag on one registration. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireAdminPassword(request);

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const verified = Boolean(body?.payment_verified);

    const { data, error } = await supabaseAdmin
      .from('event_registrations')
      .update({ payment_verified: verified })
      .eq('id', id)
      .select('id, payment_verified')
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(
      successResponse(data, verified ? 'Marked as verified' : 'Marked as unverified'),
    );
  } catch (err) {
    return handleError(err);
  }
}
