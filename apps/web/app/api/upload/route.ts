import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../lib/supabase';
import { json, requireAdminPassword, handleError } from '../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';
import crypto from 'crypto';
import path from 'path';

const ALLOWED_IMAGES = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const ALLOWED_VIDEOS = ['.mp4', '.webm', '.mov'];
const ALLOWED_EXTS = [...ALLOWED_IMAGES, ...ALLOWED_VIDEOS];
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

async function uploadFile(file: File, folder: string) {
  const ext = path.extname(file.name).toLowerCase();

  if (!ALLOWED_EXTS.includes(ext)) {
    return json(
      errorResponse('UPLOAD_ERROR', `File type ${ext} not allowed`),
      400,
    );
  }

  if (file.size > MAX_SIZE) {
    return json(
      errorResponse('UPLOAD_ERROR', 'File too large. Maximum allowed size is 5MB.'),
      413,
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${folder}/${crypto.randomUUID()}${ext}`;

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
}

export async function POST(request: NextRequest) {
  try {
    requireAdminPassword(request);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return json(errorResponse('NO_FILE', 'No file provided'), 400);
    }

    const folder =
      request.nextUrl.searchParams.get('folder') || 'avatars';

    return await uploadFile(file, folder);
  } catch (err) {
    return handleError(err);
  }
}
