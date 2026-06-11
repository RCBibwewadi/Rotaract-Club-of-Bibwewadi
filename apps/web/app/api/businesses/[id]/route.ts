import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../../lib/middleware';
import {
  UpdateBusinessSchema,
  successResponse,
  errorResponse,
  fromZodError,
  type UpdateBusinessInput,
} from '@rcb-2.0/shared';
import { ZodError } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = authenticate(request);
    requireApproved(user);
    const { id } = await params;

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
        is_visible,
        members (
          member_id,
          full_name,
          avatar_url
        )
      `)
      .eq('business_id', id)
      .eq('is_visible', true)
      .single();

    if (error) {
      return json(errorResponse('NOT_FOUND', 'Business not found'), 404);
    }

    return json(successResponse(data));
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = authenticate(request);
    requireApproved(user);
    const { id } = await params;

    const raw = await request.json();
    let body: UpdateBusinessInput;
    try {
      body = UpdateBusinessSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { data: existing } = await supabase
      .from('businesses')
      .select('business_id')
      .eq('business_id', id)
      .eq('member_id', user.member_id)
      .single();

    if (!existing) {
      return json(
        errorResponse('FORBIDDEN', 'You do not own this business'),
        403,
      );
    }

    const { data, error } = await supabase
      .from('businesses')
      .update(body)
      .eq('business_id', id)
      .select('*')
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'Business updated successfully'));
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = authenticate(request);
    requireApproved(user);
    const { id } = await params;

    const { data: existing } = await supabase
      .from('businesses')
      .select('business_id')
      .eq('business_id', id)
      .eq('member_id', user.member_id)
      .single();

    if (!existing) {
      return json(
        errorResponse('FORBIDDEN', 'You do not own this business'),
        403,
      );
    }

    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('business_id', id);

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(null, 'Business deleted successfully'));
  } catch (err) {
    return handleError(err);
  }
}
