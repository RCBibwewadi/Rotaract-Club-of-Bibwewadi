import { NextRequest } from 'next/server';
import { supabase } from '../lib/supabase';
import { json, requireAdminPassword, handleError } from '../lib/middleware';
import {
  CreateFomoSchema,
  successResponse,
  errorResponse,
  fromZodError,
  type CreateFomoInput,
} from '@rcb-2.0/shared';
import { ZodError } from 'zod';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('fomo')
      .select(`
        fomo_id,
        category,
        name,
        description,
        thumbnail,
        images,
        videos,
        event_id,
        events (
          event_id,
          event_name,
          event_date,
          event_avenue
        )
      `)
      .order('category');

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
    requireAdminPassword(request);

    const raw = await request.json();
    let body: CreateFomoInput;
    try {
      body = CreateFomoSchema.parse(raw);
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
      .insert(body)
      .select('*')
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(
      successResponse(data, 'FOMO post created successfully'),
      201,
    );
  } catch (err) {
    return handleError(err);
  }
}
