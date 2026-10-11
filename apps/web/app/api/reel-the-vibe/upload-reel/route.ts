import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../lib/supabase';
import { json, authenticate, requireApproved, handleError } from '../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';
import crypto from 'crypto';
import path from 'path';

const ALLOWED_EXTS = ['.mp4', '.webm', '.mov'];
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    // Find user's registration
    const { data: reg } = await supabaseAdmin
      .from('reel_the_vibe')
      .select('id')
      .eq('member_id', user.member_id)
      .maybeSingle();

    if (!reg) {
      return json(errorResponse('NOT_REGISTERED', 'You are not registered for Reel the Vibe'), 400);
    }

    // Find user's team
    const { data: team } = await supabaseAdmin
      .from('reel_the_vibe_teams')
      .select('team_id, reel_video_url')
      .or(`member1_id.eq.${reg.id},member2_id.eq.${reg.id},member3_id.eq.${reg.id}`)
      .maybeSingle();

    if (!team) {
      return json(errorResponse('NO_TEAM', 'You are not assigned to a team yet'), 400);
    }

    if (team.reel_video_url) {
      return json(errorResponse('ALREADY_UPLOADED', 'Your team has already uploaded a reel'), 409);
    }

    const formData = await request.formData();
    const file = formData.get('video') as File | null;

    if (!file) {
      return json(errorResponse('NO_FILE', 'Video file is required'), 400);
    }

    const ext = path.extname(file.name).toLowerCase();

    if (!ALLOWED_EXTS.includes(ext)) {
      return json(errorResponse('INVALID_FILE', `Only ${ALLOWED_EXTS.join(', ')} allowed`), 400);
    }

    if (file.size > MAX_SIZE) {
      return json(errorResponse('FILE_TOO_LARGE', 'Video must be under 100MB'), 413);
    }

    // Upload video to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `reel-the-vibe/reels/${crypto.randomUUID()}${ext}`;

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

    // Update team with reel URL
    const { error: updateError } = await supabaseAdmin
      .from('reel_the_vibe_teams')
      .update({
        reel_video_url: urlData.publicUrl,
        reel_uploaded_at: new Date().toISOString(),
      })
      .eq('team_id', team.team_id);

    if (updateError) {
      return json(errorResponse('DB_ERROR', updateError.message), 500);
    }

    return json(successResponse({ url: urlData.publicUrl }, 'Reel uploaded successfully!'), 201);
  } catch (err) {
    return handleError(err);
  }
}
