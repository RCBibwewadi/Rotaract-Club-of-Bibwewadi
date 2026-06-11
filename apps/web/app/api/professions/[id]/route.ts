import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../../lib/middleware';
import {
  UpdateProfessionSchema,
  successResponse,
  errorResponse,
  fromZodError,
  type UpdateProfessionInput,
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
      .from('professions')
      .select(`
        profession_id,
        profession_type,
        specialisation,
        years_experience,
        employer,
        is_primary,
        members (
          member_id,
          full_name,
          avatar_url
        )
      `)
      .eq('profession_id', id)
      .eq('is_visible', true)
      .single();

    if (error) {
      return json(errorResponse('NOT_FOUND', 'Profession not found'), 404);
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
    let body: UpdateProfessionInput;
    try {
      body = UpdateProfessionSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { data: existing } = await supabase
      .from('professions')
      .select('profession_id')
      .eq('profession_id', id)
      .eq('member_id', user.member_id)
      .single();

    if (!existing) {
      return json(
        errorResponse('FORBIDDEN', 'You do not own this profession'),
        403,
      );
    }

    if (body.is_primary) {
      await supabase
        .from('professions')
        .update({ is_primary: false })
        .eq('member_id', user.member_id)
        .eq('is_primary', true);
    }

    const { data, error } = await supabase
      .from('professions')
      .update(body)
      .eq('profession_id', id)
      .select('*')
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'Profession updated successfully'));
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
      .from('professions')
      .select('profession_id, is_primary')
      .eq('profession_id', id)
      .eq('member_id', user.member_id)
      .single();

    if (!existing) {
      return json(
        errorResponse('FORBIDDEN', 'You do not own this profession'),
        403,
      );
    }

    const { error } = await supabase
      .from('professions')
      .delete()
      .eq('profession_id', id);

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    if (existing.is_primary) {
      const { data: next } = await supabase
        .from('professions')
        .select('profession_id')
        .eq('member_id', user.member_id)
        .limit(1)
        .single();

      if (next) {
        await supabase
          .from('professions')
          .update({ is_primary: true })
          .eq('profession_id', next.profession_id);
      }
    }

    return json(successResponse(null, 'Profession deleted successfully'));
  } catch (err) {
    return handleError(err);
  }
}
