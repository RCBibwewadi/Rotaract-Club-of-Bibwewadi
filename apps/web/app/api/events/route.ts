import { NextRequest } from 'next/server';
import { supabase } from '../lib/supabase';
import { json, requireAdminPassword, handleError } from '../lib/middleware';
import {
  CreateEventSchema,
  successResponse,
  errorResponse,
  fromZodError,
  type CreateEventInput,
} from '@rcb-2.0/shared';
import { ZodError } from 'zod';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        event_id,
        event_name,
        event_date,
        event_time,
        event_place,
        event_strength,
        open_to_all,
        event_avenue,
        event_description,
        event_images,
        event_videos,
        members!event_lead_id (
          member_id,
          full_name,
          avatar_url
        ),
        fomo (
          fomo_id,
          category,
          name,
          images,
          videos
        )
      `)
      .order('event_date', { ascending: false });

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
    let body: CreateEventInput;
    try {
      body = CreateEventSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { data, error } = await supabase
      .from('events')
      .insert(body)
      .select('*')
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'Event created successfully'), 201);
  } catch (err) {
    return handleError(err);
  }
}
