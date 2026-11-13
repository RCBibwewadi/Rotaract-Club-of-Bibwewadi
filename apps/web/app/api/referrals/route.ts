import { NextRequest, after } from 'next/server';
import { supabase } from '../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../lib/middleware';
import {
  CreateReferralSchema,
  REFERRAL_SELECT,
  shapeReferral,
  type RawReferral,
} from '../lib/referrals';
import { notifyMembers } from '../lib/push';
import { successResponse, errorResponse, fromZodError } from '@rcb-2.0/shared';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    const { data, error } = await supabase
      .from('referrals')
      .select(REFERRAL_SELECT)
      .order('created_at', { ascending: false });

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    const referrals = (data as unknown as RawReferral[]).map((row) =>
      shapeReferral(row, user.member_id),
    );

    return json(successResponse(referrals));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    let body;
    try {
      body = CreateReferralSchema.parse(await request.json());
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { data, error } = await supabase
      .from('referrals')
      .insert({
        member_id: user.member_id,
        title: body.title,
        description: body.description,
        location: body.location,
        budget: body.budget || null,
        contact_method: body.contact_method,
      })
      .select(REFERRAL_SELECT)
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    after(() =>
      notifyMembers(
        {
          title: 'New on The Connect',
          body: body.title,
          tab: 'referrals',
          url: '/app/referrals',
        },
        user.member_id,
      ),
    );

    return json(
      successResponse(shapeReferral(data as unknown as RawReferral, user.member_id), 'Referral posted'),
      201,
    );
  } catch (err) {
    return handleError(err);
  }
}
