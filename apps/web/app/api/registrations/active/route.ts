import { supabaseAdmin } from '../../lib/supabase';
import { json, handleError } from '../../lib/middleware';
import { PUBLIC_FORM_COLUMNS } from '../../lib/registrations';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

// GET /api/registrations/active — the active form's public config, or null.
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('registration_forms')
      .select(PUBLIC_FORM_COLUMNS)
      .eq('is_active', true)
      .maybeSingle();

    if (error) return json(errorResponse('DB_ERROR', error.message), 500);
    return json(successResponse(data));
  } catch (err) {
    return handleError(err);
  }
}
