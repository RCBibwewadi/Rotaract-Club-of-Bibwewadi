import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import { hashPassword } from '../../lib/auth';
import { json, handleError } from '../../lib/middleware';
import {
  RegisterSchema,
  errorResponse,
  successResponse,
  fromZodError,
  type RegisterInput,
} from '@rcb-2.0/shared';
import type { MemberType } from '@rcb-2.0/shared';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    let body: RegisterInput;
    try {
      body = RegisterSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const password_hash = await hashPassword(body.password);

    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert({
        full_name: body.full_name,
        email: body.email,
        username: body.username,
        password_hash,
        member_type: body.member_type,
        phone: body.phone || null,
        dob: body.dob || null,
        interests: body.interests || null,
        role: 'member',
        is_approved: false,
        is_active: true,
      })
      .select('member_id, username, email, member_type')
      .single();

    if (memberError) {
      if (memberError.code === '23505') {
        return json(
          errorResponse('DUPLICATE_ENTRY', 'Email or username already taken'),
          409,
        );
      }
      return json(
        errorResponse('INTERNAL_SERVER_ERROR', memberError.message),
        500,
      );
    }

    if (
      body.business &&
      (body.member_type === 'business_only' || body.member_type === 'both')
    ) {
      await supabase.from('businesses').insert({
        member_id: member.member_id,
        business_name: body.business.business_name,
        industry: body.business.industry || null,
        designation: body.business.designation || null,
        description: body.business.description || null,
        website_url: body.business.website_url || null,
        business_city: body.business.business_city || null,
        is_visible: true,
      });
    }

    if (
      body.profession &&
      (body.member_type === 'profession_only' || body.member_type === 'both')
    ) {
      await supabase.from('professions').insert({
        member_id: member.member_id,
        profession_type: body.profession.profession_type,
        specialisation: body.profession.specialisation || null,
        years_experience: body.profession.years_experience || null,
        employer: body.profession.employer || null,
        is_primary: true,
        is_visible: true,
      });
    }

    return json(
      successResponse(
        {
          member_id: member.member_id,
          username: member.username,
          email: member.email,
          member_type: member.member_type as MemberType,
        },
        'Registration successful! Your account is pending admin approval.',
      ),
      201,
    );
  } catch (err) {
    return handleError(err);
  }
}
