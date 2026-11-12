import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

interface RawInterest {
  created_at: string;
  referrals: { referral_id: string; title: string } | null;
  members: {
    member_id: string;
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

/**
 * Who has expressed interest in the caller's own referrals, for the profile
 * screen. Scoped to referrals this member posted, so it cannot be used to read
 * anyone else's interested list.
 */
export async function GET(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    const { data: mine, error: mineError } = await supabase
      .from('referrals')
      .select('referral_id')
      .eq('member_id', user.member_id);

    if (mineError) {
      return json(errorResponse('DB_ERROR', mineError.message), 500);
    }

    const ids = (mine ?? []).map((row) => row.referral_id);
    if (ids.length === 0) {
      return json(successResponse([]));
    }

    const { data, error } = await supabase
      .from('referral_interests')
      .select(`
        created_at,
        referrals ( referral_id, title ),
        members ( member_id, full_name, avatar_url, phone, email )
      `)
      .in('referral_id', ids)
      .order('created_at', { ascending: false });

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    const interests = (data as unknown as RawInterest[]).map((row) => ({
      created_at: row.created_at,
      referral: row.referrals,
      member: row.members,
    }));

    return json(successResponse(interests));
  } catch (err) {
    return handleError(err);
  }
}
