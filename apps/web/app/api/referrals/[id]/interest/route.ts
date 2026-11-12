import { NextRequest } from 'next/server';
import { supabase } from '../../../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../../../lib/middleware';
import { fetchContact } from '../../../lib/referrals';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

/**
 * Registers this member's interest in a referral and answers with the poster's
 * contact detail. Interest is a primary key on (referral_id, member_id), so a
 * second tap re-reads the same row rather than adding another.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = authenticate(request);
    requireApproved(user);
    const { id } = await params;

    const { data: referral, error: readError } = await supabase
      .from('referrals')
      .select('referral_id, member_id, contact_method, status')
      .eq('referral_id', id)
      .single();

    if (readError || !referral) {
      return json(errorResponse('NOT_FOUND', 'Referral not found'), 404);
    }
    if (referral.member_id === user.member_id) {
      return json(
        errorResponse('FORBIDDEN', 'This is your own referral'),
        403,
      );
    }
    if (referral.status !== 'open') {
      return json(errorResponse('CLOSED', 'This referral is closed'), 409);
    }

    // upsert, not insert: tapping twice (or on a flaky connection) must not
    // fail and must not double-count.
    const { error: writeError } = await supabase
      .from('referral_interests')
      .upsert(
        { referral_id: id, member_id: user.member_id },
        { onConflict: 'referral_id,member_id', ignoreDuplicates: true },
      );

    if (writeError) {
      return json(errorResponse('DB_ERROR', writeError.message), 500);
    }

    const { count } = await supabase
      .from('referral_interests')
      .select('member_id', { count: 'exact', head: true })
      .eq('referral_id', id);

    const contact = await fetchContact(referral.member_id, referral.contact_method);

    return json(
      successResponse(
        { contact, interest_count: count ?? 0 },
        'Thanks for showing interest! Feel free to reach out and connect with the person who posted this referral.',
      ),
    );
  } catch (err) {
    return handleError(err);
  }
}
