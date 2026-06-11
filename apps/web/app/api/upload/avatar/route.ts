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

const ALLOWED_IMAGES = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const ALLOWED_VIDEOS = ['.mp4', '.webm', '.mov'];
const ALLOWED_EXTS = [...ALLOWED_IMAGES, ...ALLOWED_VIDEOS];
const MAX_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return json(errorResponse('NO_FILE', 'No file provided'), 400);
    }

    const ext = path.extname(file.name).toLowerCase();

    if (!ALLOWED_EXTS.includes(ext)) {
      return json(
        errorResponse('UPLOAD_ERROR', `File type ${ext} not allowed`),
        400,
      );
    }

    if (file.size > MAX_SIZE) {
      return json(
        errorResponse('UPLOAD_ERROR', 'File too large (max 50MB)'),
        400,
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `avatars/${crypto.randomUUID()}${ext}`;

    const { error } = await supabaseAdmin.storage
      .from('media')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return json(errorResponse('UPLOAD_ERROR', error.message), 500);
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('media')
      .getPublicUrl(filename);

    return json(
      successResponse(
        { url: urlData.publicUrl },
        'File uploaded successfully',
      ),
      201,
    );
  } catch (err) {
    return handleError(err);
  }
}
