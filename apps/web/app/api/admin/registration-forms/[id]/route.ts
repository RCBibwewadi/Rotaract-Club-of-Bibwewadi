import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { supabaseAdmin } from '../../../lib/supabase';
import { json, requireAdminPassword, requireRegistrationPassword, handleError } from '../../../lib/middleware';
import { FormSchema, cleanupMedia } from '../../../lib/registrations';
import { successResponse, errorResponse, fromZodError } from '@rcb-2.0/shared';

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/registration-forms/:id
 *   { is_active: boolean }  -> activate (deactivating any other) or deactivate
 *   full form body          -> update the configuration
 */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    requireAdminPassword(request);
    requireRegistrationPassword(request);
    const { id } = await params;
    const body = await request.json();

    if (typeof body?.is_active === 'boolean' && Object.keys(body).length === 1) {
      const { error } = body.is_active
        ? await supabaseAdmin.rpc('activate_registration_form', { p_form_id: id })
        : await supabaseAdmin.from('registration_forms')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('form_id', id);
      if (error) return json(errorResponse('DB_ERROR', error.message), 500);
      return json(successResponse(null, body.is_active ? 'Form is now live' : 'Form disabled'));
    }

    const input = FormSchema.parse(body);
    const { data: old, error: oldErr } = await supabaseAdmin
      .from('registration_forms')
      .select('image_url, video_url, payment_qr_url')
      .eq('form_id', id)
      .maybeSingle();
    if (oldErr) return json(errorResponse('DB_ERROR', oldErr.message), 500);
    if (!old) return json(errorResponse('NOT_FOUND', 'Form not found'), 404);

    const { data, error } = await supabaseAdmin
      .from('registration_forms')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('form_id', id)
      .select()
      .single();
    if (error) return json(errorResponse('DB_ERROR', error.message), 500);

    // Only after the row points at the new files: drop the replaced ones.
    await cleanupMedia([old.image_url, old.video_url, old.payment_qr_url]);

    return json(successResponse(data, 'Form saved'));
  } catch (err) {
    if (err instanceof ZodError) return json(fromZodError(err), 400);
    return handleError(err);
  }
}

// DELETE /api/admin/registration-forms/:id — only forms with no submissions.
export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    requireAdminPassword(request);
    requireRegistrationPassword(request);
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('registration_forms')
      .delete()
      .eq('form_id', id)
      .select('image_url, video_url, payment_qr_url')
      .maybeSingle();

    if (error) {
      if (error.code === '23503') {
        return json(errorResponse('HAS_REGISTRATIONS', 'This form has registrations. Disable it instead of deleting.'), 409);
      }
      return json(errorResponse('DB_ERROR', error.message), 500);
    }
    if (!data) return json(errorResponse('NOT_FOUND', 'Form not found'), 404);

    await cleanupMedia([data.image_url, data.video_url, data.payment_qr_url]);
    return json(successResponse(null, 'Form deleted'));
  } catch (err) {
    return handleError(err);
  }
}
