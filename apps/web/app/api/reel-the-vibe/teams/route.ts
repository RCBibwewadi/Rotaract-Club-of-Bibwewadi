import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../lib/supabase';
import { json, authenticate, handleError } from '../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

// GET — get current user's team (requires auth, only works after reveal)
export async function GET(request: NextRequest) {
  try {
    const user = authenticate(request);

    // Check phase
    const { data: config } = await supabaseAdmin
      .from('reel_config')
      .select('value')
      .eq('key', 'phase')
      .maybeSingle();

    const phase = config?.value || 'registration';

    if (phase !== 'revealed' && phase !== 'voting') {
      return json(successResponse({ phase, team: null }));
    }

    // Find user's registration
    const { data: reg } = await supabaseAdmin
      .from('reel_the_vibe')
      .select('id')
      .eq('member_id', user.member_id)
      .maybeSingle();

    if (!reg) {
      return json(successResponse({ phase, team: null }));
    }

    // Find user's team
    const { data: team } = await supabaseAdmin
      .from('reel_the_vibe_teams')
      .select('*')
      .or(`member1_id.eq.${reg.id},member2_id.eq.${reg.id},member3_id.eq.${reg.id}`)
      .maybeSingle();

    if (!team) {
      return json(successResponse({ phase, team: null }));
    }

    // Get all team members' details
    const memberIds = [team.member1_id, team.member2_id, team.member3_id].filter(Boolean);
    const { data: members } = await supabaseAdmin
      .from('reel_the_vibe')
      .select('id, photo_url, status, members!inner(full_name, avatar_url)')
      .in('id', memberIds);

    return json(successResponse({
      phase,
      team: {
        ...team,
        members: members || [],
      },
    }));
  } catch (err) {
    return handleError(err);
  }
}
