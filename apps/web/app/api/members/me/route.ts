import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../../lib/middleware';
import {
  UpdateMemberSchema,
  successResponse,
  errorResponse,
  fromZodError,
  type UpdateMemberInput,
} from '@rcb-2.0/shared';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    const { data, error } = await supabase
      .from('members')
      .select(`
        member_id,
        full_name,
        email,
        phone,
        username,
        avatar_url,
        member_type,
        years_in_rcb,
        interests,
        rid,
        dob,
        businesses (*),
        professions (*),
        member_visibility (*)
      `)
      .eq('member_id', user.member_id)
      .single();

    if (error) {
      return json(errorResponse('NOT_FOUND', 'Member not found'), 404);
    }

    return json(successResponse(data));
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    const raw = await request.json();
    let body: UpdateMemberInput;
    try {
      body = UpdateMemberSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { data, error } = await supabase
      .from('members')
      .update(body)
      .eq('member_id', user.member_id)
      .select(`
        member_id,
        full_name,
        email,
        phone,
        avatar_url,
        member_type,
        years_in_rcb,
        interests
      `)
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'Profile updated successfully'));
  } catch (err) {
    return handleError(err);
  }
}
