import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../lib/supabase';
import { json, handleError } from '../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';
import crypto from 'crypto';
import path from 'path';

const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return json(errorResponse('NO_FILE', 'No file provided'), 400);
    }

    const ext = path.extname(file.name).toLowerCase();

    if (!ALLOWED.includes(ext)) {
      return json(
        errorResponse('UPLOAD_ERROR', `File type ${ext} not allowed. Use JPG, PNG, WEBP, or PDF.`),
        400,
      );
    }

    if (file.size > MAX_SIZE) {
      return json(errorResponse('UPLOAD_ERROR', 'File too large (max 5MB)'), 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `payment-proofs/${crypto.randomUUID()}${ext}`;

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
      successResponse({ url: urlData.publicUrl }, 'File uploaded successfully'),
      201,
    );
  } catch (err) {
    return handleError(err);
  }
}
