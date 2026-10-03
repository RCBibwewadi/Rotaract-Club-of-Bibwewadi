import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../lib/supabase';
import { json, handleError } from '../../lib/middleware';
import { successResponse, errorResponse } from '@rcb-2.0/shared';

const REEL_PASS = process.env.REEL_PASS || '';

function requireReelPass(request: NextRequest) {
  const pass = request.headers.get('x-reel-pass');
  if (!pass || pass !== REEL_PASS) {
    throw Object.assign(new Error('Invalid reel password'), { status: 401 });
  }
}

interface ReelSong {
  id: string;
  name: string;
  artist: string;
  ref?: string;
}

async function getSongs(): Promise<ReelSong[]> {
  const { data } = await supabaseAdmin.from('reel_config').select('value').eq('key', 'songs').maybeSingle();
  if (!data?.value) return [];
  try { return JSON.parse(data.value); } catch { return []; }
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// GET — get full admin data (teams, votes, phase)
export async function GET(request: NextRequest) {
  try {
    requireReelPass(request);

    const [phaseRes, teamsRes, registrationsRes, votesRes, songs] = await Promise.all([
      supabaseAdmin.from('reel_config').select('*').eq('key', 'phase').maybeSingle(),
      supabaseAdmin.from('reel_the_vibe_teams').select('*').order('created_at'),
      supabaseAdmin.from('reel_the_vibe').select('*, members!inner(full_name, email, avatar_url)').order('created_at'),
      supabaseAdmin.from('reel_the_vibe_votes').select('*').order('created_at'),
      getSongs(),
    ]);

    // Count votes per team
    const voteCountMap: Record<string, number> = {};
    (votesRes.data || []).forEach((v: { team_id: string }) => {
      voteCountMap[v.team_id] = (voteCountMap[v.team_id] || 0) + 1;
    });

    // Enrich teams with member names and vote counts
    const teams = (teamsRes.data || []).map((team: Record<string, unknown>) => {
      const memberIds = [team.member1_id, team.member2_id, team.member3_id].filter(Boolean);
      const members = (registrationsRes.data || []).filter((r: Record<string, unknown>) => memberIds.includes(r.id));
      return {
        ...team,
        members,
        vote_count: voteCountMap[team.team_id as string] || 0,
      };
    });

    // Sort by votes descending
    teams.sort((a: { vote_count: number }, b: { vote_count: number }) => b.vote_count - a.vote_count);

    return json(successResponse({
      phase: phaseRes.data?.value || 'registration',
      teams,
      registrations: registrationsRes.data || [],
      total_votes: (votesRes.data || []).length,
      songs,
    }));
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
      return json(errorResponse('UNAUTHORIZED', 'Invalid reel password'), 401);
    }
    return handleError(err);
  }
}

// POST — phase control actions
export async function POST(request: NextRequest) {
  try {
    requireReelPass(request);

    const { action, team_id, registration_id, song, song_id } = await request.json();

    switch (action) {
      case 'open_registrations': {
        await supabaseAdmin.from('reel_config').upsert({ key: 'phase', value: 'registration' }, { onConflict: 'key' });
        return json(successResponse(null, 'Registrations opened'));
      }

      case 'stimulate': {
        // Get all registered members
        const { data: registrations } = await supabaseAdmin
          .from('reel_the_vibe')
          .select('id, member_id')
          .eq('status', 'registered');

        if (!registrations || registrations.length < 3) {
          return json(errorResponse('NOT_ENOUGH', 'Need at least 3 registrations to make teams'), 400);
        }

        const dbSongs = await getSongs();
        if (!dbSongs.length) {
          return json(errorResponse('NO_SONGS', 'Add songs before stimulating teams'), 400);
        }

        // Shuffle and group into teams of 3
        const shuffled = shuffleArray(registrations);
        const shuffledSongs = shuffleArray(dbSongs);
        const teams = [];

        for (let i = 0; i + 2 < shuffled.length; i += 3) {
          teams.push({
            team_name: `Team ${Math.floor(i / 3) + 1}`,
            member1_id: shuffled[i].id,
            member2_id: shuffled[i + 1].id,
            member3_id: shuffled[i + 2].id,
            assigned_song: shuffledSongs[Math.floor(i / 3) % shuffledSongs.length].name,
          });
        }

        // Handle leftover (1-2 members) — add to last team or skip
        // For now, leftovers don't get a team

        // Delete existing teams first
        await supabaseAdmin.from('reel_the_vibe_votes').delete().neq('vote_id', '00000000-0000-0000-0000-000000000000');
        await supabaseAdmin.from('reel_the_vibe_teams').delete().neq('team_id', '00000000-0000-0000-0000-000000000000');

        // Insert new teams
        const { error } = await supabaseAdmin.from('reel_the_vibe_teams').insert(teams);
        if (error) return json(errorResponse('DB_ERROR', error.message), 500);

        await supabaseAdmin.from('reel_config').upsert({ key: 'phase', value: 'stimulated' }, { onConflict: 'key' });

        return json(successResponse({ teams_created: teams.length }, 'Teams stimulated'));
      }

      case 'reveal': {
        await supabaseAdmin.from('reel_config').upsert({ key: 'phase', value: 'revealed' }, { onConflict: 'key' });
        return json(successResponse(null, 'Teams revealed to participants'));
      }

      case 'voting': {
        await supabaseAdmin.from('reel_config').upsert({ key: 'phase', value: 'voting' }, { onConflict: 'key' });
        return json(successResponse(null, 'Voting phase started'));
      }

      case 'disqualify': {
        if (!team_id) return json(errorResponse('MISSING_FIELD', 'team_id required'), 400);

        await supabaseAdmin
          .from('reel_the_vibe_teams')
          .update({ status: 'disqualified' })
          .eq('team_id', team_id);

        // Block members
        const { data: team } = await supabaseAdmin
          .from('reel_the_vibe_teams')
          .select('member1_id, member2_id, member3_id')
          .eq('team_id', team_id)
          .single();

        if (team) {
          const memberIds = [team.member1_id, team.member2_id, team.member3_id].filter(Boolean);
          for (const mid of memberIds) {
            await supabaseAdmin.from('reel_the_vibe').update({ status: 'blocked' }).eq('id', mid);
          }
        }

        return json(successResponse(null, 'Team disqualified'));
      }

      case 'remove_user': {
        if (!registration_id) return json(errorResponse('MISSING_FIELD', 'registration_id required'), 400);

        // Remove from any team
        await supabaseAdmin
          .from('reel_the_vibe_teams')
          .update({ member1_id: null })
          .eq('member1_id', registration_id);
        await supabaseAdmin
          .from('reel_the_vibe_teams')
          .update({ member2_id: null })
          .eq('member2_id', registration_id);
        await supabaseAdmin
          .from('reel_the_vibe_teams')
          .update({ member3_id: null })
          .eq('member3_id', registration_id);

        // Delete registration
        await supabaseAdmin
          .from('reel_the_vibe')
          .delete()
          .eq('id', registration_id);

        return json(successResponse(null, 'User removed'));
      }

      case 'add_song': {
        if (!song?.name || !song?.artist) {
          return json(errorResponse('MISSING_FIELD', 'name and artist required'), 400);
        }
        const currentSongs = await getSongs();
        const newSong: ReelSong = { id: crypto.randomUUID(), name: song.name, artist: song.artist, ...(song.ref ? { ref: song.ref } : {}) };
        currentSongs.push(newSong);
        await supabaseAdmin.from('reel_config').upsert({ key: 'songs', value: JSON.stringify(currentSongs) }, { onConflict: 'key' });
        return json(successResponse(newSong, 'Song added'));
      }

      case 'remove_song': {
        if (!song_id) return json(errorResponse('MISSING_FIELD', 'song_id required'), 400);
        const currentSongs2 = await getSongs();
        const filtered = currentSongs2.filter(s => s.id !== song_id);
        await supabaseAdmin.from('reel_config').upsert({ key: 'songs', value: JSON.stringify(filtered) }, { onConflict: 'key' });
        return json(successResponse(null, 'Song removed'));
      }

      default:
        return json(errorResponse('INVALID_ACTION', `Unknown action: ${action}`), 400);
    }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
      return json(errorResponse('UNAUTHORIZED', 'Invalid reel password'), 401);
    }
    return handleError(err);
  }
}
