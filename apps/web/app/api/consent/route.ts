import { NextRequest } from 'next/server';
import { supabase } from '../lib/supabase';
import { json, authenticate, handleError } from '../lib/middleware';
import { CONSENT_VERSION } from '@/lib/app/consent';
import { successResponse, errorResponse, fromZodError } from '@rcb-2.0/shared';
import { z, ZodError } from 'zod';

// The member's standing position is the newest row they wrote; older rows are
// the audit trail and are never updated or deleted.
const SELECT = 'personal_data_consent, ai_training_consent, consent_version, accepted_at';

// personal_data_consent is the processing the app cannot run without, so the
// only value worth recording is acceptance: an unchecked box is simply not
// submitted. Training consent is free to be either.
const RecordConsentSchema = z.object({
  personal_data_consent: z.literal(true),
  ai_training_consent: z.boolean(),
});

/**
 * Approval is deliberately not required on either method: a member whose
 * account is still pending passes through the app's consent gate like anyone
 * else, and must be able to answer before the club has approved them.
 */
export async function GET(request: NextRequest) {
  try {
    const user = authenticate(request);

    const { data, error } = await supabase
      .from('member_consents')
      .select(SELECT)
      .eq('member_id', user.member_id)
      .order('accepted_at', { ascending: false })
      .order('consent_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    // null means "never answered", which the gate treats as no consent at all.
    return json(successResponse(data ?? null));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = authenticate(request);

    const raw = await request.json();
    let body: z.infer<typeof RecordConsentSchema>;
    try {
      body = RecordConsentSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { data, error } = await supabase
      .from('member_consents')
      .insert({
        member_id: user.member_id,
        personal_data_consent: body.personal_data_consent,
        ai_training_consent: body.ai_training_consent,
        consent_version: CONSENT_VERSION,
      })
      .select(SELECT)
      .single();

    // A failed write must not read as consent: the app keeps the member at the
    // gate and shows this message rather than letting them in.
    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'Consent saved'), 201);
  } catch (err) {
    return handleError(err);
  }
}
