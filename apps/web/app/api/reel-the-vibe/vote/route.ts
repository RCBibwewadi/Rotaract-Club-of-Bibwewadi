import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../lib/supabase';
import {
  json,
  authenticate,
  requireApproved,
  handleError,
} from '../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

export async function POST(request: NextRequest) {
  try {
    const user = authenticate(request);
    requireApproved(user);

    const { team_id } = await request.json();

    if (!team_id) {
      return json(errorResponse('MISSING_FIELD', 'team_id is required'), 400);
    }

    // Verify team exists and has uploaded a reel
    const { data: team } = await supabaseAdmin
      .from('reel_the_vibe_teams')
      .select('team_id, reel_video_url')
      .eq('team_id', team_id)
      .maybeSingle();

    if (!team) {
      return json(errorResponse('NOT_FOUND', 'Team not found'), 404);
    }

    if (!team.reel_video_url) {
      return json(errorResponse('NO_REEL', 'This team has not uploaded a reel yet'), 400);
    }

    // Check total votes by this user (max 2)
    const { data: allUserVotes } = await supabaseAdmin
      .from('reel_the_vibe_votes')
      .select('vote_id, team_id')
      .eq('voter_member_id', user.member_id);

    if (allUserVotes?.some(v => v.team_id === team_id)) {
      return json(errorResponse('ALREADY_VOTED', 'You already voted for this team'), 409);
    }

    if ((allUserVotes?.length || 0) >= 2) {
      return json(errorResponse('MAX_VOTES', 'You can only vote for 2 teams'), 400);
    }

    const { data, error } = await supabaseAdmin
      .from('reel_the_vibe_votes')
      .insert({
        voter_member_id: user.member_id,
        team_id,
      })
      .select()
      .single();

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    return json(successResponse(data, 'Vote recorded'), 201);
  } catch (err) {
    return handleError(err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = authenticate(request);

    // Get vote counts per team
    const { data: teams, error } = await supabaseAdmin
      .from('reel_the_vibe_teams')
      .select(`
        team_id,
        team_name,
        assigned_song,
        reel_video_url,
        reel_thumbnail_url,
        reel_uploaded_at,
        reel_the_vibe_votes ( count )
      `)
      .not('reel_video_url', 'is', null);

    if (error) {
      return json(errorResponse('DB_ERROR', error.message), 500);
    }

    // Get user's votes
    const { data: userVotes } = await supabaseAdmin
      .from('reel_the_vibe_votes')
      .select('team_id')
      .eq('voter_member_id', user.member_id);

    return json(successResponse({
      teams,
      user_votes: userVotes?.map(v => v.team_id) || [],
    }));
  } catch (err) {
    return handleError(err);
  }
}
