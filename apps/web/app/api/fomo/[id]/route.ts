import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import { json, requireAdminPassword, handleError } from '../../lib/middleware';
import {
  UpdateFomoSchema,
  successResponse,
  errorResponse,
  fromZodError,
  type UpdateFomoInput,
} from '@rcb-2.0/shared';
import { ZodError } from 'zod';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('fomo')
      .select(`
        *,
        events (
          event_id,
          event_name,
          event_date,
          event_place,
          event_avenue
        )
      `)
      .eq('fomo_id', id)
      .single();

    if (error) {
      return json(errorResponse('NOT_FOUND', 'FOMO post not found'), 404);
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
    let body: UpdateFomoInput;
    try {
      body = UpdateFomoSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    if (body.event_id) {
      const { data: event } = await supabase
        .from('events')
        .select('event_id')
        .eq('event_id', body.event_id)
        .single();

      if (!event) {
        return json(errorResponse('NOT_FOUND', 'Event not found'), 404);
      }
    }

    const { data, error } = await supabase
      .from('fomo')
      .update(body)
      .eq('fomo_id', id)
      .select('*')
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'FOMO post updated successfully'));
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

    const { error } = await supabase
      .from('fomo')
      .delete()
      .eq('fomo_id', id);

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(null, 'FOMO post deleted successfully'));
  } catch (err) {
    return handleError(err);
  }
}
