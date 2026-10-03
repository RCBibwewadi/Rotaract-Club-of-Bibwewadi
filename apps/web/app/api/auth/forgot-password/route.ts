import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { supabase } from '../../lib/supabase';
import { json, handleError } from '../../lib/middleware';
import { errorResponse, successResponse } from '@rcb-2.0/shared';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not configured');
  return new Resend(key);
}

function buildResetEmailHtml(name: string, resetLink: string): string {
  const logoUrl = 'https://www.rcbibwewadipune.org/logo.png';
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: linear-gradient(135deg, #8b1a2b, #a82640); padding: 32px; text-align: center;">
        <img src="${logoUrl}" alt="RCB Logo" width="64" height="64" style="border-radius: 50%; margin-bottom: 12px;" />
        <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Rotaract Club of Bibwewadi, Pune</p>
      </div>
      <div style="padding: 32px;">
        <p style="font-size: 15px; color: #374151; line-height: 1.8;">
          Hi <strong>${name}</strong>,
        </p>
        <p style="font-size: 15px; color: #374151; line-height: 1.8;">
          We received a request to reset your password. Click the button below to set a new password:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #8b1a2b, #a82640); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 13px; color: #6b7280; line-height: 1.8;">
          This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
        <p style="font-size: 13px; color: #6b7280; line-height: 1.6; word-break: break-all;">
          If the button doesn't work, copy and paste this link:<br/>
          <a href="${resetLink}" style="color: #8b1a2b;">${resetLink}</a>
        </p>
      </div>
      <div style="background: #8b1a2b; padding: 16px; text-align: center;">
        <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">Rotaract Club of Bibwewadi, Pune &bull; www.rcbibwewadipune.org</p>
      </div>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return json(
        errorResponse('VALIDATION_ERROR', 'Email is required'),
        400,
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Look up member by email
    const { data: member, error } = await supabase
      .from('members')
      .select('member_id, full_name, email')
      .eq('email', normalizedEmail)
      .single();

    if (error || !member) {
      // Don't reveal whether email exists — always show success
      return json(successResponse(null, 'If an account with that email exists, a reset link has been sent.'));
    }

    // Generate a short-lived JWT token for password reset
    const resetToken = jwt.sign(
      { member_id: member.member_id, purpose: 'password-reset' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' },
    );

    // Build reset link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    // Send email via Resend
    await getResend().emails.send({
      from: 'Rotaract Club of Bibwewadi <no-reply@rcbibwewadipune.org>',
      replyTo: 'rotaractclubofbibwewadi@gmail.com',
      to: member.email,
      subject: 'Reset Your Password — RCB',
      html: buildResetEmailHtml(member.full_name, resetLink),
    });

    return json(successResponse(null, 'If an account with that email exists, a reset link has been sent.'));
  } catch (err) {
    return handleError(err);
  }
}
