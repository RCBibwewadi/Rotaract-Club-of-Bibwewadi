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

/**
 * Phone numbers were entered in mixed formats (+91XXXXXXXXXX, 91XXXXXXXXXX,
 * plain 10-digit). Match against every shape the same number could be stored as.
 */
function phoneVariants(digits: string): string[] {
  const last10 = digits.slice(-10);
  return [...new Set([digits, last10, `91${last10}`, `+91${last10}`, `0${last10}`])];
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    let body: { identifier: string; password: string };
    try {
      body = LoginSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { identifier, password } = body;

    // One field, three ways in: username, email or phone.
    const digits = identifier.replace(/\D/g, '');
    const isEmail = identifier.includes('@');
    const isPhone = !isEmail && /^[+\d][\d\s().-]*$/.test(identifier) && digits.length >= 10;

    let query = supabase
      .from('members')
      .select('member_id, username, password_hash, role, is_approved, is_active');

    if (isEmail) {
      query = query.eq('email', identifier.toLowerCase());
    } else if (isPhone) {
      query = query.in('phone', phoneVariants(digits));
    } else {
      query = query.eq('username', identifier.toLowerCase());
    }

    // limit(2) so an ambiguous match is rejected instead of picking one at random
    const { data: rows, error } = await query.limit(2);
    const member = rows?.length === 1 ? rows[0] : null;

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
