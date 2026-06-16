import { NextRequest } from 'next/server';
import { supabase } from '../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../lib/middleware';
import {
  CreateBusinessSchema,
  successResponse,
  errorResponse,
  fromZodError,
  type CreateBusinessInput,
} from '@rcb-2.0/shared';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    const { data, error } = await supabase
      .from('businesses')
      .select(`
        business_id,
        business_name,
        industry,
        designation,
        description,
        website_url,
        business_city,
        members!inner (
          member_id,
          full_name,
          email,
          phone,
          avatar_url,
          member_visibility (show_contact, open_to_collab)
        )
      `)
      .eq('is_visible', true)
      .neq('member_id', user.member_id)
      .eq('members.is_approved', true)
      .eq('members.is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    const raw = await request.json();
    let body: CreateBusinessInput;
    try {
      body = CreateBusinessSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { data, error } = await supabase
      .from('businesses')
      .insert({ ...body, member_id: user.member_id })
      .select('*')
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'Business created successfully'), 201);
  } catch (err) {
    return handleError(err);
  }
}
