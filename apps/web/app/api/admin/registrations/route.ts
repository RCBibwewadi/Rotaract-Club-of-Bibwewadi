import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../lib/supabase';
import { json, requireAdminPassword, requireRegistrationPassword, handleError } from '../../lib/middleware';
import { PROOF_BUCKET } from '../../lib/registrations';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

const SIGNED_URL_TTL = 60 * 60; // 1 hour

// GET /api/admin/registrations — all registrations, newest first, with a
// short-lived signed URL for each payment proof. The UI groups them by form.
export async function GET(request: NextRequest) {
  try {
    requireAdminPassword(request);
    requireRegistrationPassword(request);

    const { data, error } = await supabaseAdmin
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return json(errorResponse('DB_ERROR', error.message), 500);

    const paths = data.map(r => r.payment_proof_path).filter(Boolean) as string[];
    const urls = new Map<string, string>();
    if (paths.length) {
      const { data: signed } = await supabaseAdmin.storage
        .from(PROOF_BUCKET)
        .createSignedUrls(paths, SIGNED_URL_TTL);
      for (const s of signed || []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
    }

    return json(successResponse(data.map(r => ({
      ...r,
      payment_proof_url: r.payment_proof_path ? urls.get(r.payment_proof_path) ?? null : null,
    }))));
  } catch (err) {
    return handleError(err);
  }
}
