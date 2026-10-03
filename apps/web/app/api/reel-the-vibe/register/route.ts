import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';
import crypto from 'crypto';
import path from 'path';

const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    // Check if already registered
    const { data: existing } = await supabaseAdmin
      .from('reel_the_vibe')
      .select('id')
      .eq('member_id', user.member_id)
      .maybeSingle();

    if (existing) {
      return json(errorResponse('ALREADY_REGISTERED', 'You are already registered for Reel the Vibe'), 409);
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return json(errorResponse('NO_FILE', 'Photo is required'), 400);
    }

    const ext = path.extname(file.name).toLowerCase();

    if (!ALLOWED_EXTS.includes(ext)) {
      return json(errorResponse('INVALID_FILE', `Only ${ALLOWED_EXTS.join(', ')} allowed`), 400);
    }

    if (file.size > MAX_SIZE) {
      return json(errorResponse('FILE_TOO_LARGE', 'Photo must be under 5MB'), 400);
    }

    // Upload photo
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `reel-the-vibe/${crypto.randomUUID()}${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('media')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return json(errorResponse('UPLOAD_ERROR', uploadError.message), 500);
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('media')
      .getPublicUrl(filename);

    // Insert registration
    const { data, error } = await supabaseAdmin
      .from('reel_the_vibe')
      .insert({
        member_id: user.member_id,
        photo_url: urlData.publicUrl,
        status: 'registered',
      })
      .select()
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'You are IN for the Game!'), 201);
  } catch (err) {
    return handleError(err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = authenticate(request);

    const { data, error } = await supabaseAdmin
      .from('reel_the_vibe')
      .select('*')
      .eq('member_id', user.member_id)
      .maybeSingle();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse({ registered: !!data, registration: data }));
  } catch (err) {
    return handleError(err);
  }
}
