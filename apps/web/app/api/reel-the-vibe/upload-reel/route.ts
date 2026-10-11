import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../lib/supabase';
import { json, authenticate, requireApproved, handleError } from '../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';
import crypto from 'crypto';

const ALLOWED_EXTS = ['.mp4', '.webm', '.mov'];

// Step 1: Generate a signed upload URL (client uploads directly to Supabase Storage)
export async function GET(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    const ext = request.nextUrl.searchParams.get('ext')?.toLowerCase();
    if (!ext || !ALLOWED_EXTS.includes(ext)) {
      return json(errorResponse('INVALID_EXT', `Only ${ALLOWED_EXTS.join(', ')} allowed`), 400);
    }

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

    const filePath = `reel-the-vibe/reels/${crypto.randomUUID()}${ext}`;

    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from('media')
      .createSignedUploadUrl(filePath);

    if (signError || !signedData) {
      return json(errorResponse('SIGNED_URL_ERROR', signError?.message || 'Failed to create upload URL'), 500);
    }

    return json(successResponse({
      signedUrl: signedData.signedUrl,
      token: signedData.token,
      path: signedData.path,
      filePath,
      teamId: team.team_id,
    }));
  } catch (err) {
    return handleError(err);
  }
}

// Step 2: Confirm upload — client calls this after uploading directly to Supabase
export async function POST(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    const body = await request.json();
    const { filePath, teamId } = body;

    if (!filePath || !teamId) {
      return json(errorResponse('MISSING_FIELDS', 'filePath and teamId are required'), 400);
    }

    // Verify user belongs to this team
    const { data: reg } = await supabaseAdmin
      .from('reel_the_vibe')
      .select('id')
      .eq('member_id', user.member_id)
      .maybeSingle();

    if (!reg) {
      return json(errorResponse('NOT_REGISTERED', 'You are not registered for Reel the Vibe'), 400);
    }

    const { data: team } = await supabaseAdmin
      .from('reel_the_vibe_teams')
      .select('team_id, reel_video_url')
      .eq('team_id', teamId)
      .or(`member1_id.eq.${reg.id},member2_id.eq.${reg.id},member3_id.eq.${reg.id}`)
      .maybeSingle();

    if (!team) {
      return json(errorResponse('NO_TEAM', 'You are not assigned to this team'), 400);
    }

    if (team.reel_video_url) {
      return json(errorResponse('ALREADY_UPLOADED', 'Your team has already uploaded a reel'), 409);
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('media')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabaseAdmin
      .from('reel_the_vibe_teams')
      .update({
        reel_video_url: urlData.publicUrl,
        reel_uploaded_at: new Date().toISOString(),
      })
      .eq('team_id', teamId);

    if (updateError) {
      return json(errorResponse('DB_ERROR', updateError.message), 500);
    }

    return json(successResponse({ url: urlData.publicUrl }, 'Reel uploaded successfully!'), 201);
  } catch (err) {
    return handleError(err);
  }
}
