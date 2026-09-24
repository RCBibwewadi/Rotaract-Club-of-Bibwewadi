import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';
import { json, handleError } from '../../../lib/middleware';
import { successResponse, errorResponse, EventRegistrationSchema } from '@rcb-2.0/shared';
import { ZodError } from 'zod';
import { GARBA_SLUG, GARBA, registrationsClosed } from '@/lib/garba-event';
import crypto from 'crypto';
import path from 'path';

// Payment screenshots go to the existing `media` bucket under the event slug,
// the same way membership payment proofs live under `payment-proofs/`.
const BUCKET = 'media';
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.pdf'];
const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf',
];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

// ── Rate limit: 5 submissions per IP per 10 minutes ──────────
// In-memory, so it resets on redeploy and is per-instance. That is fine here:
// it is a speed bump against a script hammering the form, not a security
// boundary — the unique index on the transaction id is what actually stops
// duplicate registrations.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  // Keep the map from growing without bound on a long-lived instance.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every(t => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return false;
}

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    if (registrationsClosed()) {
      return json(
        errorResponse('REGISTRATION_CLOSED', 'Registrations for this event are closed.'),
        403,
      );
    }

    if (rateLimited(clientIp(request))) {
      return json(
        errorResponse('RATE_LIMITED', 'Too many attempts. Please wait a few minutes and try again.'),
        429,
      );
    }

    const formData = await request.formData();

    // Honeypot: a field no real person sees, so anything filling it is a bot.
    // Answer 201 so the bot believes it worked and does not retry.
    if (String(formData.get('website') || '').trim()) {
      return json(successResponse({ received: true }), 201);
    }

    let body;
    try {
      body = EventRegistrationSchema.parse({
        full_name: String(formData.get('full_name') || ''),
        phone: String(formData.get('phone') || ''),
        reference: String(formData.get('reference') || '') || undefined,
      });
    } catch (err) {
      if (err instanceof ZodError) {
        const issue = err.issues[0];
        return json(
          { success: false, error: { code: 'VALIDATION_ERROR', field: issue?.path?.[0], message: issue?.message || 'Invalid input' }, message: issue?.message || 'Invalid input' },
          400,
        );
      }
      throw err;
    }

    // ── Payment screenshot ──────────────────────────────────
    const file = formData.get('payment_screenshot');
    if (!(file instanceof File) || file.size === 0) {
      return json(errorResponse('VALIDATION_ERROR', 'Please attach a screenshot of your payment.'), 400);
    }
    if (file.size > MAX_SIZE) {
      return json(errorResponse('VALIDATION_ERROR', 'That file is larger than 10 MB.'), 400);
    }
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXT.includes(ext) || !ALLOWED_MIME.includes(file.type)) {
      return json(
        errorResponse('VALIDATION_ERROR', 'Attach a JPG, PNG, WEBP, HEIC image or a PDF.'),
        400,
      );
    }

    // Reserve the id up front so the stored object and the row share it.
    const id = crypto.randomUUID();
    const objectPath = `${GARBA_SLUG}/${id}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Hashing the bytes is what stops the same screenshot being submitted
    // twice, now that the form no longer asks for a transaction id.
    const screenshotHash = crypto.createHash('sha256').update(buffer).digest('hex');

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(objectPath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return json(errorResponse('UPLOAD_ERROR', 'We could not save your screenshot. Please try again.'), 500);
    }

    const { data, error } = await supabaseAdmin
      .from('event_registrations')
      .insert({
        id,
        event_slug: GARBA_SLUG,
        full_name: body.full_name,
        phone: body.phone,
        reference: body.reference ?? null,
        payment_screenshot_path: objectPath,
        screenshot_sha256: screenshotHash,
        amount_inr: GARBA.feeInr,
      })
      .select('id, full_name')
      .single();

    if (error) {
      // The row never landed, so don't leave the screenshot orphaned.
      await supabaseAdmin.storage.from(BUCKET).remove([objectPath]);

      if (error.code === '23505') {
        return json(
          errorResponse('DUPLICATE_SCREENSHOT', 'This payment screenshot has already been used for a registration.'),
          409,
        );
      }
      return json(errorResponse('DB_ERROR', 'Something went wrong saving your registration.'), 500);
    }

    return json(
      successResponse({
        full_name: data.full_name,
        reference_code: String(data.id).slice(0, 8).toUpperCase(),
      }),
      201,
    );
  } catch (err) {
    return handleError(err);
  }
}
