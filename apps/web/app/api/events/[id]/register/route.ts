import { NextRequest } from 'next/server';
import { supabase } from '../../../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

/**
 * Registers the member for an event, and answers with the new attending count.
 *
 * Registration is a primary key on (event_id, member_id), so a second tap
 * re-reads the same row rather than booking a second seat.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = authenticate(request);
    requireApproved(user);
    const { id } = await params;

    const { data: event, error: readError } = await supabase
      .from('events')
      .select('event_id, registration_enabled, event_strength')
      .eq('event_id', id)
      .single();

    if (readError || !event) {
      return json(errorResponse('NOT_FOUND', 'Event not found'), 404);
    }
    if (!event.registration_enabled) {
      return json(errorResponse('CLOSED', 'Registration is closed for this event'), 403);
    }

    const countFor = async () => {
      const { count } = await supabase
        .from('event_registrations')
        .select('member_id', { count: 'exact', head: true })
        .eq('event_id', id);
      return count ?? 0;
    };

    const { data: existing } = await supabase
      .from('event_registrations')
      .select('member_id')
      .eq('event_id', id)
      .eq('member_id', user.member_id)
      .maybeSingle();

    if (existing) {
      return json(
        successResponse({ attending_count: await countFor(), my_registration: true }),
      );
    }

    // event_strength doubles as the cap when the admin has set one.
    if (event.event_strength && (await countFor()) >= event.event_strength) {
      return json(errorResponse('FULL', 'This event is already full'), 409);
    }

    const { error: writeError } = await supabase
      .from('event_registrations')
      .upsert(
        { event_id: id, member_id: user.member_id },
        { onConflict: 'event_id,member_id', ignoreDuplicates: true },
      );

    if (writeError) {
      return json(errorResponse('DB_ERROR', writeError.message), 500);
    }

    return json(
      successResponse(
        { attending_count: await countFor(), my_registration: true },
        'You are registered — see you there!',
      ),
    );
  } catch (err) {
    return handleError(err);
  }
}
