import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../lib/supabase';
import { json, optionalMember, handleError } from '../../lib/middleware';
import { PUBLIC_FORM_COLUMNS } from '../../lib/registrations';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

// GET /api/registrations/active — the active form's public config, or null.
// Signed-in callers also get my_registration: whether they already submitted it.
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('registration_forms')
      .select(PUBLIC_FORM_COLUMNS)
      .eq('is_active', true)
      .maybeSingle();

    if (error) return json(errorResponse('DB_ERROR', error.message), 500);

    const memberId = data && optionalMember(request);
    if (!memberId) return json(successResponse(data && { ...data, my_registration: false }));

    const { count, error: regErr } = await supabaseAdmin
      .from('registrations')
      .select('registration_id', { count: 'exact', head: true })
      .eq('form_id', data.form_id)
      .eq('member_id', memberId);
    if (regErr) return json(errorResponse('DB_ERROR', regErr.message), 500);
    return json(successResponse({ ...data, my_registration: !!count }));
  } catch (err) {
    return handleError(err);
  }
}
