import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';
import { json, requireAdminPassword, requireRegistrationPassword, handleError } from '../../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

/**
 * PATCH /api/admin/registrations/:id  { action: 'approve' | 'reject' }
 * Only pending registrations change; a repeated click is a no-op error.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdminPassword(request);
    requireRegistrationPassword(request);
    const { id } = await params;
    const { action } = await request.json();

    if (action === 'reject') {
      const { data, error } = await supabaseAdmin
        .from('registrations')
        .update({ status: 'rejected' })
        .eq('registration_id', id)
        .eq('status', 'pending')
        .select('registration_id')
        .maybeSingle();
      if (error) return json(errorResponse('DB_ERROR', error.message), 500);
      if (!data) return json(errorResponse('INVALID_STATE', 'Only pending registrations can be rejected'), 409);
      return json(successResponse(null, 'Registration rejected'));
    }

    if (action === 'approve') {
      // Conditional update: a repeated click finds no pending row and stops here.
      const { data, error } = await supabaseAdmin
        .from('registrations')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('registration_id', id)
        .eq('status', 'pending')
        .select('registration_id, payment_status')
        .maybeSingle();
      if (error) return json(errorResponse('DB_ERROR', error.message), 500);
      if (!data) return json(errorResponse('INVALID_STATE', 'Only pending registrations can be approved'), 409);

      if (data.payment_status === 'submitted') {
        await supabaseAdmin.from('registrations').update({ payment_status: 'verified' }).eq('registration_id', id);
      }

      return json(successResponse(null, 'Registration approved'));
    }

    return json(errorResponse('INVALID_INPUT', 'Unknown action'), 400);
  } catch (err) {
    return handleError(err);
  }
}
