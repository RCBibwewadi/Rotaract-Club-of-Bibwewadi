import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../../lib/middleware';
import {
  REFERRAL_SELECT,
  fetchContact,
  shapeReferral,
  type RawReferral,
} from '../../lib/referrals';
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
      .from('referrals')
      .select(REFERRAL_SELECT)
      .eq('referral_id', id)
      .single();

    if (error || !data) {
      return json(errorResponse('NOT_FOUND', 'Referral not found'), 404);
    }

    const referral = shapeReferral(data as unknown as RawReferral, user.member_id);

    // The contact comes back with the referral once interest is registered, so
    // reopening the screen still shows it; everyone else never receives it.
    const contact =
      referral.my_interest && referral.author
        ? await fetchContact(referral.author.member_id, referral.contact_method)
        : null;

    return json(successResponse({ ...referral, contact }));
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = authenticate(request);
    requireApproved(user);
    const { id } = await params;

    // Scoped to the poster, so a member can only take down their own referral.
    const { data, error } = await supabase
      .from('referrals')
      .delete()
      .eq('referral_id', id)
      .eq('member_id', user.member_id)
      .select('referral_id')
      .maybeSingle();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }
    if (!data) {
      return json(errorResponse('NOT_FOUND', 'Referral not found'), 404);
    }

    return json(successResponse({ referral_id: id }, 'Referral removed'));
  } catch (err) {
    return handleError(err);
  }
}
