import { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';
import { json, authenticate, requireApproved, handleError } from '../../lib/middleware';
import { successResponse, errorResponse, fromZodError } from '@rcb-2.0/shared';
import { z, ZodError } from 'zod';

// The shape PushSubscription.toJSON() produces, minus the fields we ignore.
const SubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

/** Records the browser the member just granted notification permission in. */
export async function POST(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    let body;
    try {
      body = SubscriptionSchema.parse(await request.json());
    } catch (err) {
      if (err instanceof ZodError) {
        return json(fromZodError(err), 400);
      }
      throw err;
    }

    // Upsert on the endpoint: a browser keeps the same one across sign-ins, so
    // this also moves a shared device's subscription to whoever is signed in.
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        endpoint: body.endpoint,
        member_id: user.member_id,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      },
      { onConflict: 'endpoint' },
    );

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse({ endpoint: body.endpoint }, 'Notifications on'), 201);
  } catch (err) {
    return handleError(err);
  }
}

/** Turning notifications off, or signing out of this browser. */
export async function DELETE(request: NextRequest) {
  try {
    const user = authenticate(request);

    const endpoint = request.nextUrl.searchParams.get('endpoint');
    if (!endpoint) {
      return json(errorResponse('VALIDATION_ERROR', 'endpoint is required'), 400);
    }

    // Scoped to the caller so one member cannot unsubscribe another's device.
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('member_id', user.member_id);

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse({ endpoint }, 'Notifications off'));
  } catch (err) {
    return handleError(err);
  }
}
