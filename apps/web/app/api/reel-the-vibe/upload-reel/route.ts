import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../lib/supabase';
import { json, authenticate, requireApproved, handleError } from '../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

const DRIVE_LINK_RE = /^https:\/\/(drive\.google\.com|docs\.google\.com)\//;

export async function POST(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    const body = await request.json();
    const { driveLink } = body;

    if (!driveLink || typeof driveLink !== 'string') {
      return json(errorResponse('MISSING_FIELDS', 'Google Drive link is required'), 400);
    }

    if (!DRIVE_LINK_RE.test(driveLink)) {
      return json(errorResponse('INVALID_LINK', 'Please provide a valid Google Drive link'), 400);
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
      return json(errorResponse('ALREADY_UPLOADED', 'Your team has already submitted a reel link'), 409);
    }

    const { error: updateError } = await supabaseAdmin
      .from('reel_the_vibe_teams')
      .update({
        reel_video_url: driveLink.trim(),
        reel_uploaded_at: new Date().toISOString(),
      })
      .eq('team_id', team.team_id);

    if (updateError) {
      return json(errorResponse('DB_ERROR', updateError.message), 500);
    }

    return json(successResponse({ url: driveLink.trim() }, 'Reel link submitted successfully!'), 201);
  } catch (err) {
    return handleError(err);
  }
}
