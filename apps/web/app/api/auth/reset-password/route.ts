import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '../../lib/supabase';
import { hashPassword } from '../../lib/auth';
import { json, handleError } from '../../lib/middleware';
import { errorResponse, successResponse } from '@rcb-2.0/shared';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword, confirmPassword } = await request.json();

    if (!token || !newPassword || !confirmPassword) {
      return json(
        errorResponse('VALIDATION_ERROR', 'Token, new password and confirm password are required'),
        400,
      );
    }

    if (newPassword !== confirmPassword) {
      return json(
        errorResponse('VALIDATION_ERROR', 'Passwords do not match'),
        400,
      );
    }

    if (newPassword.length < 6) {
      return json(
        errorResponse('VALIDATION_ERROR', 'Password must be at least 6 characters'),
        400,
      );
    }

    // Verify the reset token
    let decoded: { member_id: string; purpose: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { member_id: string; purpose: string };
    } catch {
      return json(
        errorResponse('INVALID_TOKEN', 'Reset link is invalid or has expired. Please request a new one.'),
        400,
      );
    }

    if (decoded.purpose !== 'password-reset') {
      return json(
        errorResponse('INVALID_TOKEN', 'Invalid reset token'),
        400,
      );
    }

    // Verify member exists
    const { data: member, error } = await supabase
      .from('members')
      .select('member_id')
      .eq('member_id', decoded.member_id)
      .single();

    if (error || !member) {
      return json(
        errorResponse('NOT_FOUND', 'Account not found'),
        404,
      );
    }

    // Hash new password and update
    const password_hash = await hashPassword(newPassword);

    const { error: updateError } = await supabase
      .from('members')
      .update({ password_hash })
      .eq('member_id', member.member_id);

    if (updateError) {
      return json(
        errorResponse('UPDATE_FAILED', 'Failed to update password'),
        500,
      );
    }

    return json(successResponse(null, 'Password updated successfully'));
  } catch (err) {
    return handleError(err);
  }
}
