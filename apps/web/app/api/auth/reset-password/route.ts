import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import { hashPassword } from '../../lib/auth';
import { json, handleError } from '../../lib/middleware';
import { errorResponse, successResponse } from '@rcb-2.0/shared';

export async function POST(request: NextRequest) {
  try {
    const { code, newPassword } = await request.json();

    if (!code || !newPassword) {
      return json(
        errorResponse('VALIDATION_ERROR', 'Code and new password are required'),
        400,
      );
    }

    if (newPassword.length < 6) {
      return json(
        errorResponse('VALIDATION_ERROR', 'Password must be at least 6 characters'),
        400,
      );
    }

    // Code format: username-email
    const separatorIndex = code.indexOf('-');
    if (separatorIndex === -1) {
      return json(
        errorResponse('INVALID_CODE', 'Invalid reset code'),
        400,
      );
    }

    const username = code.substring(0, separatorIndex);
    const email = code.substring(separatorIndex + 1);

    // Validate against DB
    const { data: member, error } = await supabase
      .from('members')
      .select('member_id, username, email')
      .eq('username', username)
      .eq('email', email)
      .single();

    if (error || !member) {
      return json(
        errorResponse('INVALID_CODE', 'Invalid reset code. Please check your username and email.'),
        400,
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
