import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../lib/supabase';
import { json, requireAdminPassword, handleError } from '../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';
import { GARBA_SLUG } from '@/lib/garba-event';

const BUCKET = 'media';
const SIGNED_URL_TTL = 60 * 10; // 10 minutes

/** Registrations for one event, newest first, with short-lived screenshot links. */
export async function GET(request: NextRequest) {
  try {
    requireAdminPassword(request);

    const slug = request.nextUrl.searchParams.get('event_slug') || GARBA_SLUG;

    const { data, error } = await supabaseAdmin
      .from('event_registrations')
      .select('id, event_slug, full_name, phone, reference, upi_txn_id, payment_screenshot_path, amount_inr, payment_verified, created_at')
      .eq('event_slug', slug)
      .order('created_at', { ascending: false });

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    // The bucket path is never handed out raw; each row gets a link that expires.
    const rows = await Promise.all(
      (data || []).map(async row => {
        const { data: signed } = await supabaseAdmin.storage
          .from(BUCKET)
          .createSignedUrl(row.payment_screenshot_path, SIGNED_URL_TTL);
        return { ...row, screenshot_url: signed?.signedUrl || null };
      }),
    );

    return json(successResponse(rows));
  } catch (err) {
    return handleError(err);
  }
}
