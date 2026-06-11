import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import { json, requireAdminPassword, handleError } from '../../lib/middleware';
import {
  UpdateEventSchema,
  successResponse,
  errorResponse,
  fromZodError,
  type UpdateEventInput,
} from '@rcb-2.0/shared';
import { ZodError } from 'zod';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        members!event_lead_id (
          member_id,
          full_name,
          avatar_url
        ),
        best_member:members!event_best_member (
          member_id,
          full_name,
          avatar_url
        ),
        fomo (*)
      `)
      .eq('event_id', id)
      .single();

    if (error) {
      return json(errorResponse('NOT_FOUND', 'Event not found'), 404);
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
    let body: UpdateEventInput;
    try {
      body = UpdateEventSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { data, error } = await supabase
      .from('events')
      .update(body)
      .eq('event_id', id)
      .select('*')
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'Event updated successfully'));
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
      .from('events')
      .delete()
      .eq('event_id', id);

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(null, 'Event deleted successfully'));
  } catch (err) {
    return handleError(err);
  }
}
