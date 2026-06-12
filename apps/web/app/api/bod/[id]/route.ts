import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import { json, requireAdminPassword, handleError } from '../../lib/middleware';
import {
  UpdateBodSchema,
  successResponse,
  errorResponse,
  fromZodError,
  type UpdateBodInput,
} from '@rcb-2.0/shared';
import { ZodError } from 'zod';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('bod')
      .select('*')
      .eq('bod_id', id)
      .single();

    if (error) {
      return json(errorResponse('NOT_FOUND', 'BOD member not found'), 404);
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
    requireAdminPassword(request);
    const { id } = await params;

    const raw = await request.json();
    let body: UpdateBodInput;
    try {
      body = UpdateBodSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { data, error } = await supabase
      .from('bod')
      .update(body)
      .eq('bod_id', id)
      .select('*')
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'BOD member updated successfully'));
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireAdminPassword(request);
    const { id } = await params;

    const { error } = await supabase.from('bod').delete().eq('bod_id', id);

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(null, 'BOD member removed successfully'));
  } catch (err) {
    return handleError(err);
  }
}
