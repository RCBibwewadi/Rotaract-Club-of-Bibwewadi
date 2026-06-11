import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import { verifyPassword, signToken } from '../../lib/auth';
import { json, handleError } from '../../lib/middleware';
import {
  LoginSchema,
  errorResponse,
  successResponse,
  fromZodError,
} from '@rcb-2.0/shared';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    let body: { username: string; password: string };
    try {
      body = LoginSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { username, password } = body;

    const { data: member, error } = await supabase
      .from('members')
      .select(
        'member_id, username, password_hash, role, is_approved, is_active',
      )
      .eq('username', username)
      .single();

    if (error || !member) {
      return json(
        errorResponse('INVALID_CREDENTIALS', 'Invalid credentials'),
        401,
      );
    }

    if (!member.is_active) {
      return json(
        errorResponse('ACCOUNT_DEACTIVATED', 'Account has been deactivated'),
        403,
      );
    }

    const valid = await verifyPassword(password, member.password_hash);
    if (!valid) {
      return json(
        errorResponse('INVALID_CREDENTIALS', 'Invalid credentials'),
        401,
      );
    }

    if (member.role === 'member' && !member.is_approved) {
      return json(
        errorResponse('PENDING_APPROVAL', 'Account pending admin approval'),
        403,
      );
    }

    const token = signToken({
      member_id: member.member_id,
      username: member.username,
      role: member.role,
      is_approved: member.is_approved,
    });

    return json(
      successResponse(
        { token, role: member.role, username: member.username },
        'Login successful',
      ),
    );
  } catch (err) {
    return handleError(err);
  }
}
