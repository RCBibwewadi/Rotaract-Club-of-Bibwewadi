'use client';

import { useState, useEffect } from 'react';
import { Trophy, Music, Users, Loader2 } from 'lucide-react';

interface LeaderboardTeam {
  team_id: string;
  team_name: string;
  assigned_song: string;
  members: string[];
  votes: number;
}

export default function LeaderboardPage() {
  const [teams, setTeams] = useState<LeaderboardTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reel-the-vibe/leaderboard')
      .then(r => r.json())
      .then(d => { if (d.data) setTeams(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getRankStyle = (rank: number) => {
    if (rank === 0) return { bg: 'rgba(185,130,85,0.12)', border: 'rgba(185,130,85,0.3)', color: '#B98255', icon: true };
    if (rank === 1) return { bg: 'rgba(169,160,149,0.08)', border: 'rgba(169,160,149,0.2)', color: '#A9A095', icon: false };
    if (rank === 2) return { bg: 'rgba(139,110,80,0.08)', border: 'rgba(139,110,80,0.2)', color: '#8B6E50', icon: false };
    return { bg: 'rgba(255,255,255,0.02)', border: 'rgba(90,81,70,0.15)', color: '#5A5146', icon: false };
  };

  return (
    <div className="min-h-screen bg-black relative z-10">
      {/* Header */}
      <div className="pt-28 pb-10 text-center">
        <span
          className="text-[11px] uppercase tracking-[4px] font-medium"
          style={{ color: '#B98255' }}
        >
          Reel the Vibe
        </span>
        <h1
          className="font-display text-3xl sm:text-4xl md:text-5xl font-medium mt-3"
          style={{ color: '#E8DFD2' }}
        >
          Leaderboard
        </h1>
        <div
          className="w-12 h-px mx-auto mt-4"
          style={{ background: 'linear-gradient(to right, transparent, #B98255, transparent)' }}
        />
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: '#B98255' }} />
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-20">
            <Trophy size={36} className="mx-auto mb-4" style={{ color: '#5A5146' }} />
            <p className="text-sm" style={{ color: '#A9A095' }}>No teams yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Table header */}
            <div
              className="grid grid-cols-[48px_1fr_1fr_80px] sm:grid-cols-[56px_1.2fr_1.5fr_90px] gap-3 px-5 py-3 text-[10px] uppercase tracking-[2px] font-medium"
              style={{ color: '#5A5146' }}
            >
              <span>Rank</span>
              <span>Team</span>
              <span>Members</span>
              <span className="text-right">Votes</span>
            </div>

            {/* Rows */}
            {teams.map((team, rank) => {
              const style = getRankStyle(rank);
              return (
                <div
                  key={team.team_id}
                  className="grid grid-cols-[48px_1fr_1fr_80px] sm:grid-cols-[56px_1.2fr_1.5fr_90px] gap-3 items-center px-5 py-4 rounded-2xl transition-all duration-300 group"
                  style={{
                    background: style.bg,
                    border: `1px solid ${style.border}`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(185,130,85,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = style.border; }}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center">
                    {style.icon ? (
                      <Trophy size={20} style={{ color: '#B98255' }} />
                    ) : (
                      <span
                        className="text-lg font-display font-medium"
                        style={{ color: style.color }}
                      >
                        {rank + 1}
                      </span>
                    )}
                  </div>

                  {/* Team name + song */}
                  <div>
                    <p
                      className="font-display text-sm sm:text-base font-medium tracking-wider"
                      style={{ color: '#E8DFD2' }}
                    >
                      {team.team_name}
                    </p>
                    {/* <div className="flex items-center gap-1.5 mt-0.5">
                      <Music size={10} style={{ color: '#B98255' }} />
                      <span className="text-[11px] truncate" style={{ color: '#A9A095' }}>
                        {team.assigned_song}
                      </span>
                    </div> */}
                  </div>

                  {/* Members */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Users size={12} style={{ color: '#5A5146' }} className="flex-shrink-0" />
                    <span className="text-xs truncate" style={{ color: '#A9A095' }}>
                      {team.members.join(', ')}
                    </span>
                  </div>

                  {/* Votes */}
                  <div className="text-right">
                    <span
                      className="font-display text-lg sm:text-xl font-medium"
                      style={{ color: rank === 0 ? '#B98255' : '#E8DFD2' }}
                    >
                      {team.votes}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
