import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { supabaseAdmin } from '../../lib/supabase';
import { json, requireAdminPassword, requireRegistrationPassword, handleError } from '../../lib/middleware';
import { FormSchema } from '../../lib/registrations';
import { successResponse, errorResponse, fromZodError } from '@rcb-2.0/shared';

// GET /api/admin/registration-forms — every form, newest first, with submission counts.
export async function GET(request: NextRequest) {
  try {
    requireAdminPassword(request);
    requireRegistrationPassword(request);
    const { data, error } = await supabaseAdmin
      .from('registration_forms')
      .select('*, registrations(count)')
      .order('created_at', { ascending: false });
    if (error) return json(errorResponse('DB_ERROR', error.message), 500);
    return json(successResponse(data));
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/admin/registration-forms — create (inactive; activate via PATCH).
export async function POST(request: NextRequest) {
  try {
    requireAdminPassword(request);
    requireRegistrationPassword(request);
    const input = FormSchema.parse(await request.json());
    const { data, error } = await supabaseAdmin
      .from('registration_forms')
      .insert(input)
      .select()
      .single();
    if (error) return json(errorResponse('DB_ERROR', error.message), 500);
    return json(successResponse(data, 'Form created'), 201);
  } catch (err) {
    if (err instanceof ZodError) return json(fromZodError(err), 400);
    return handleError(err);
  }
}
