import { supabaseAdmin } from '../../lib/supabase';
import { json, handleError } from '../../lib/middleware';
import { successResponse } from '@rcb-2.0/shared';

export async function GET() {
  try {
    // Get all teams with members and vote counts
    const { data: teams, error } = await supabaseAdmin
      .from('reel_the_vibe_teams')
      .select('team_id, team_name, assigned_song, member1_id, member2_id, member3_id, status')
      .neq('status', 'disqualified')
      .order('created_at');

    if (error) return json({ error: error.message }, 500);

    // Get all registrations with member names
    const { data: registrations } = await supabaseAdmin
      .from('reel_the_vibe')
      .select('id, members!inner(full_name)');

    // Get vote counts per team
    const { data: votes } = await supabaseAdmin
      .from('reel_the_vibe_votes')
      .select('team_id');

    const voteMap: Record<string, number> = {};
    (votes || []).forEach((v: { team_id: string }) => {
      voteMap[v.team_id] = (voteMap[v.team_id] || 0) + 1;
    });

    const regMap = new Map<string, string>();
    (registrations || []).forEach((r: { id: string; members: { full_name: string } | { full_name: string }[] }) => {
      const m = Array.isArray(r.members) ? r.members[0] : r.members;
      regMap.set(r.id, m?.full_name || 'Unknown');
    });

    const enriched = (teams || []).map((t: { team_id: string; team_name: string; assigned_song: string; member1_id: string; member2_id: string; member3_id: string }) => {
      const memberIds = [t.member1_id, t.member2_id, t.member3_id].filter(Boolean);
      const members = memberIds.map(id => regMap.get(id) || 'Unknown');
      return {
        team_id: t.team_id,
        team_name: t.team_name,
        assigned_song: t.assigned_song,
        members,
        votes: voteMap[t.team_id] || 0,
      };
    });

    enriched.sort((a: { votes: number }, b: { votes: number }) => b.votes - a.votes);

    return json(successResponse(enriched));
  } catch (err) {
    return handleError(err);
  }
}
