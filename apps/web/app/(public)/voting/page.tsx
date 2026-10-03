'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Check, Music, Loader2, Lock } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface ReelTeam {
  team_id: string;
  team_name: string;
  assigned_song: string;
  reel_video_url: string;
  reel_thumbnail_url?: string;
}

const MAX_VOTES = 2;

export default function VotingPage() {
  const { token } = useAuthStore();
  const [teams, setTeams] = useState<ReelTeam[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carouselOffset, setCarouselOffset] = useState(0);
  const touchStartX = useRef(0);
  const activeVideoRef = useRef<HTMLVideoElement>(null);

  const isLoggedIn = token !== null;

  // Fetch teams with reels
  useEffect(() => {
    if (!token) return;
    fetch('/api/reel-the-vibe/vote', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.data?.teams?.length) {
          setTeams(d.data.teams);
          if (d.data.user_votes?.length) {
            setSelectedIds(new Set(d.data.user_votes));
            if (d.data.user_votes.length >= 2) setSubmitted(true);
          }
        }
      })
      .catch(() => {});
  }, [token]);

  // Play active video
  useEffect(() => {
    activeVideoRef.current?.play().catch(() => {});
  }, [activeIdx]);

  const activeTeam = teams[activeIdx];
  const otherTeams = teams.filter((_, i) => i !== activeIdx);

  // Visible carousel range
  const visibleCount = 5;
  const maxOffset = Math.max(0, otherTeams.length - visibleCount);

  const navigate = useCallback((dir: -1 | 1) => {
    setActiveIdx(prev => {
      const next = prev + dir;
      if (next < 0) return teams.length - 1;
      if (next >= teams.length) return 0;
      return next;
    });
  }, [teams.length]);

  const selectTeamFromCarousel = (teamId: string) => {
    const idx = teams.findIndex(t => t.team_id === teamId);
    if (idx !== -1) setActiveIdx(idx);
  };

  const toggleSelect = (teamId: string) => {
    if (submitted) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else if (next.size < MAX_VOTES) {
        next.add(teamId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size !== MAX_VOTES || !token || submitted) return;
    setSubmitting(true);
    setError(null);

    try {
      for (const teamId of selectedIds) {
        const res = await fetch('/api/reel-the-vibe/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ team_id: teamId }),
        });
        const d = await res.json();
        if (!res.ok && d.code !== 'ALREADY_VOTED') {
          setError(d.message || 'Vote failed');
          return;
        }
      }
      setSubmitted(true);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
  };

  // Carousel card depth styling
  const getCarouselCardStyle = (idx: number, total: number) => {
    const center = Math.floor(Math.min(visibleCount, total) / 2);
    const visibleIdx = idx - carouselOffset;
    if (visibleIdx < 0 || visibleIdx >= visibleCount) return { opacity: 0, pointerEvents: 'none' as const };

    const distFromCenter = visibleIdx - center;
    const absD = Math.abs(distFromCenter);
    const scale = 1 - absD * 0.06;
    const rotateY = distFromCenter * -4;
    const translateZ = -absD * 30;
    const brightness = 1 - absD * 0.12;

    return {
      transform: `perspective(1000px) rotateY(${rotateY}deg) scale(${scale}) translateZ(${translateZ}px)`,
      filter: `brightness(${brightness})`,
      opacity: 1 - absD * 0.15,
      zIndex: 10 - absD,
    };
  };

  const isSelected = (id: string) => selectedIds.has(id);
  const canSelect = selectedIds.size < MAX_VOTES;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Lock size={32} className="mx-auto mb-4" style={{ color: '#B98255' }} />
          <p style={{ color: '#E8DFD2' }} className="font-display text-xl">Login to vote</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Header */}
      <div className="pt-28 pb-4 text-center relative z-10">
        <span className="text-[11px] uppercase tracking-[4px] font-medium" style={{ color: '#B98255' }}>
          Reel the Vibe
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-medium mt-2" style={{ color: '#E8DFD2' }}>
          {submitted ? 'Votes Submitted' : 'Select 2 Best Reels'}
        </h1>
        <p className="text-sm mt-2 font-mono" style={{ color: '#A9A095' }}>
          {selectedIds.size} of {MAX_VOTES} selected
        </p>
      </div>

      {/* Active reel — top center */}
      <div className="relative z-10 flex justify-center px-4 mb-6">
        <div className="relative" style={{ width: 'min(320px, 75vw)' }}>
          {/* Navigation arrows */}
          <button
            onClick={() => navigate(-1)}
            className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full mr-2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all hidden sm:flex"
            style={{ background: 'rgba(11,10,8,0.6)', border: '1px solid rgba(90,81,70,0.3)', color: '#A9A095' }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => navigate(1)}
            className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full ml-2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all hidden sm:flex"
            style={{ background: 'rgba(11,10,8,0.6)', border: '1px solid rgba(90,81,70,0.3)', color: '#A9A095' }}
          >
            <ChevronRight size={20} />
          </button>

          {/* Active card */}
          <div
            className="relative rounded-2xl overflow-hidden transition-all duration-700"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
              aspectRatio: '9/16',
              border: isSelected(activeTeam?.team_id)
                ? '2px solid rgba(185,130,85,0.7)'
                : '1px solid rgba(90,81,70,0.3)',
              boxShadow: isSelected(activeTeam?.team_id)
                ? '0 0 40px rgba(185,130,85,0.15), 0 20px 60px rgba(0,0,0,0.5)'
                : '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Video */}
            <video
              ref={activeVideoRef}
              key={activeTeam?.team_id}
              src={activeTeam?.reel_video_url}
              muted
              loop
              playsInline
              autoPlay
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Grain */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay z-10"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
            />

            {/* Selected badge */}
            {isSelected(activeTeam?.team_id) && (
              <div className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(185,130,85,0.9)' }}>
                <Check size={16} className="text-white" />
              </div>
            )}

            {/* Bottom info overlay */}
            <div className="absolute inset-x-0 bottom-0 z-10" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }}>
              <div className="px-5 pb-5 pt-16">
                <p className="font-display text-lg font-medium tracking-wider" style={{ color: '#E8DFD2' }}>
                  {activeTeam?.team_name}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Music size={12} style={{ color: '#B98255' }} />
                  <span className="text-xs" style={{ color: '#A9A095' }}>{activeTeam?.assigned_song}</span>
                </div>
              </div>
            </div>

            {/* Instagram-style top gradient */}
            <div className="absolute inset-x-0 top-0 h-20 z-10" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)' }} />
          </div>

          {/* Vote button below active card */}
          <div className="mt-4 flex justify-center">
            {submitted ? (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl" style={{ background: 'rgba(185,130,85,0.1)', border: '1px solid rgba(185,130,85,0.2)' }}>
                <Check size={14} style={{ color: '#B98255' }} />
                <span className="text-sm" style={{ color: '#B98255' }}>
                  {isSelected(activeTeam?.team_id) ? 'Voted' : 'Not Selected'}
                </span>
              </div>
            ) : (
              <button
                onClick={() => toggleSelect(activeTeam?.team_id)}
                disabled={!canSelect && !isSelected(activeTeam?.team_id)}
                className="px-6 py-3 rounded-xl font-display text-sm tracking-wide transition-all duration-300 flex items-center gap-2"
                style={{
                  background: isSelected(activeTeam?.team_id)
                    ? 'rgba(185,130,85,0.15)'
                    : canSelect
                      ? 'linear-gradient(135deg, #1A1611, #2A2118)'
                      : 'rgba(255,255,255,0.03)',
                  border: isSelected(activeTeam?.team_id)
                    ? '1px solid rgba(185,130,85,0.5)'
                    : canSelect
                      ? '1px solid rgba(90,81,70,0.3)'
                      : '1px solid rgba(255,255,255,0.05)',
                  color: isSelected(activeTeam?.team_id)
                    ? '#B98255'
                    : canSelect
                      ? '#E8DFD2'
                      : 'rgba(255,255,255,0.2)',
                  cursor: !canSelect && !isSelected(activeTeam?.team_id) ? 'not-allowed' : 'pointer',
                }}
              >
                {isSelected(activeTeam?.team_id) ? (
                  <><Check size={14} /> Selected</>
                ) : (
                  'Select'
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Carousel — remaining reels */}
      <div className="relative z-10 px-4 pb-6">
        {/* Desktop: show with arrows */}
        <div className="hidden sm:block relative max-w-4xl mx-auto">
          {carouselOffset > 0 && (
            <button
              onClick={() => setCarouselOffset(prev => Math.max(0, prev - 1))}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(11,10,8,0.7)', border: '1px solid rgba(90,81,70,0.3)', color: '#A9A095' }}
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {carouselOffset < maxOffset && (
            <button
              onClick={() => setCarouselOffset(prev => Math.min(maxOffset, prev + 1))}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(11,10,8,0.7)', border: '1px solid rgba(90,81,70,0.3)', color: '#A9A095' }}
            >
              <ChevronRight size={16} />
            </button>
          )}

          <div className="flex justify-center gap-3" style={{ perspective: '1000px' }}>
            {otherTeams.map((team, idx) => {
              const style = getCarouselCardStyle(idx, otherTeams.length);
              if (style.opacity === 0) return null;

              return (
                <button
                  key={team.team_id}
                  onClick={() => selectTeamFromCarousel(team.team_id)}
                  className="relative flex-shrink-0 rounded-xl overflow-hidden transition-all duration-700 cursor-pointer group"
                  style={{
                    width: '120px',
                    aspectRatio: '9/16',
                    ...style,
                    border: isSelected(team.team_id)
                      ? '2px solid rgba(185,130,85,0.6)'
                      : '1px solid rgba(90,81,70,0.2)',
                    boxShadow: isSelected(team.team_id)
                      ? '0 0 20px rgba(185,130,85,0.1)'
                      : '0 10px 30px rgba(0,0,0,0.4)',
                  }}
                >
                  <video src={team.reel_video_url} muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />

                  {/* Selected badge */}
                  {isSelected(team.team_id) && (
                    <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(185,130,85,0.9)' }}>
                      <Check size={10} className="text-white" />
                    </div>
                  )}

                  {/* Bottom info */}
                  <div className="absolute inset-x-0 bottom-0 z-10 px-2 pb-2 pt-8" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
                    <p className="font-display text-[10px] font-medium tracking-wider truncate" style={{ color: '#E8DFD2' }}>{team.team_name}</p>
                    <p className="text-[8px] truncate" style={{ color: '#A9A095' }}>{team.assigned_song}</p>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors z-5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile: horizontal scroll */}
        <div className="sm:hidden overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 px-2 pb-2" style={{ width: 'max-content' }}>
            {otherTeams.map((team) => (
              <button
                key={team.team_id}
                onClick={() => selectTeamFromCarousel(team.team_id)}
                className="relative flex-shrink-0 rounded-xl overflow-hidden transition-all duration-500"
                style={{
                  width: '90px',
                  aspectRatio: '9/16',
                  border: isSelected(team.team_id)
                    ? '2px solid rgba(185,130,85,0.6)'
                    : '1px solid rgba(90,81,70,0.2)',
                  boxShadow: isSelected(team.team_id)
                    ? '0 0 15px rgba(185,130,85,0.1)'
                    : '0 8px 20px rgba(0,0,0,0.3)',
                }}
              >
                <video src={team.reel_video_url} muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
                {isSelected(team.team_id) && (
                  <div className="absolute top-1.5 right-1.5 z-10 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(185,130,85,0.9)' }}>
                    <Check size={8} className="text-white" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 z-10 px-1.5 pb-1.5 pt-6" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
                  <p className="font-display text-[9px] font-medium truncate" style={{ color: '#E8DFD2' }}>{team.team_name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit section */}
      <div className="relative z-10 pb-12 px-4 text-center">
        {error && (
          <p className="text-sm mb-4" style={{ color: '#D4836A' }}>{error}</p>
        )}

        {submitted ? (
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl" style={{ background: 'rgba(185,130,85,0.1)', border: '1px solid rgba(185,130,85,0.2)' }}>
            <Check size={16} style={{ color: '#B98255' }} />
            <span className="font-display text-sm" style={{ color: '#B98255' }}>Votes Submitted</span>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={selectedIds.size !== MAX_VOTES || submitting}
            className="px-8 py-4 rounded-xl font-display text-base tracking-wide transition-all duration-300 inline-flex items-center gap-2"
            style={{
              background: selectedIds.size === MAX_VOTES
                ? 'linear-gradient(135deg, #1A1611, #2A2118)'
                : 'rgba(255,255,255,0.02)',
              border: selectedIds.size === MAX_VOTES
                ? '1px solid rgba(185,130,85,0.4)'
                : '1px solid rgba(255,255,255,0.05)',
              color: selectedIds.size === MAX_VOTES ? '#E8DFD2' : 'rgba(255,255,255,0.15)',
              cursor: selectedIds.size !== MAX_VOTES ? 'not-allowed' : 'pointer',
              boxShadow: selectedIds.size === MAX_VOTES ? '0 4px 20px rgba(185,130,85,0.08)' : 'none',
            }}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Submit Votes'}
          </button>
        )}
      </div>
    </div>
  );
}
