import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import { hashPassword } from '../../lib/auth';
import { json, handleError } from '../../lib/middleware';
import {
  SignupSchema,
  errorResponse,
  successResponse,
  fromZodError,
  type SignupInput,
} from '@rcb-2.0/shared';
import type { MemberType } from '@rcb-2.0/shared';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    let body: SignupInput;
    try {
      body = SignupSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const password_hash = await hashPassword(body.password);
    const plain_password = body.password;

    const { data, error } = await supabase
      .from('members')
      .insert({
        full_name: body.full_name,
        email: body.email,
        username: body.username,
        password_hash,
        member_type: body.member_type,
        role: 'member',
        is_approved: false,
        is_active: true,
        plain_password,
      })
      .select('member_id, username, email, member_type')
      .single();

    if (error) {
      if (error.code === '23505') {
        return json(
          errorResponse('DUPLICATE_ENTRY', 'Email or username already taken'),
          409,
        );
      }
      return json(errorResponse('INTERNAL_SERVER_ERROR', error.message), 500);
    }

    return json(
      successResponse(
        {
          member_id: data.member_id,
          username: data.username,
          email: data.email,
          member_type: data.member_type as MemberType,
        },
        'Signup successful, pending admin approval',
      ),
      201,
    );
  } catch (err) {
    return handleError(err);
  }
}
