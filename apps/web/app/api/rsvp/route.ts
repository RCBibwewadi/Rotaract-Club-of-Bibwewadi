import { NextRequest } from 'next/server';
import { supabase } from '../lib/supabase';
import { json, handleError } from '../lib/middleware';
import {
  CreateRsvpSchema,
  errorResponse,
  successResponse,
  fromZodError,
  type CreateRsvpInput,
} from '@rcb-2.0/shared';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    let body: CreateRsvpInput;
    try {
      body = CreateRsvpSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    const { data, error } = await supabase
      .from('installation_rsvps')
      .upsert(
        {
          full_name: body.full_name,
          is_rotaractor: body.is_rotaractor,
          club_name: body.club_name,
          // Blank designation falls back to the placeholder shown in the form
          designation: body.designation || 'Member',
          phone: body.phone,
          // Stored lowercase so the one-RSVP-per-email index matches exactly
          email: body.email.toLowerCase(),
        },
        { onConflict: 'email' },
      )
      .select('rsvp_id')
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'RSVP confirmed'), 201);
  } catch (err) {
    return handleError(err);
  }
}
