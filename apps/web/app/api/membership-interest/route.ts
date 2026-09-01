import { NextRequest } from 'next/server';
import { supabase } from '../lib/supabase';
import { json, handleError } from '../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

// Memberships are closed. /join now collects name, phone and email from people
// who are still interested, so the club can reach out if registrations reopen.
// Insert-only, and deliberately not readable through the public API: the rows
// live in a table with RLS closed, read via the Supabase dashboard.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const full_name = typeof body?.full_name === 'string' ? body.full_name.trim() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (full_name.length < 2) {
      return json(errorResponse('VALIDATION_ERROR', 'Name is required'), 400);
    }
    if (!/^\d{10}$/.test(phone)) {
      return json(errorResponse('VALIDATION_ERROR', 'Enter a 10-digit phone number'), 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(errorResponse('VALIDATION_ERROR', 'Enter a valid email'), 400);
    }

    // Upsert on email so someone submitting twice updates their row rather than
    // filling the table with duplicates.
    const { error } = await supabase
      .from('membership_interest')
      .upsert({ full_name, phone, email }, { onConflict: 'email' });

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse({ received: true }), 201);
  } catch (err) {
    return handleError(err);
  }
}
