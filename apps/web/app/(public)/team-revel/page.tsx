'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Music, Pencil, Check, Upload, Loader2, AlertTriangle, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

function initialsName(players: { name: string }[]) {
  return players.map(p => p.name.trim()[0]?.toUpperCase() ?? '').join('');
}

const TOTAL_HEIGHT = 600;

export default function TeamRevelPage() {
  const { token } = useAuthStore();
  const [players, setPlayers] = useState<{ name: string; photo: string }[]>([]);
  const [assignedClue, setAssignedClue] = useState({ headline: '', songs: '', theme: '' });
  const [scrollY, setScrollY] = useState(0);
  const [teamName, setTeamName] = useState('');
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(teamName);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const [reelFile, setReelFile] = useState<File | null>(null);
  const [reelPreview, setReelPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reelSubmitted, setReelSubmitted] = useState(false);
  const [reelUrl, setReelUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [vh, setVh] = useState(8);

  // Fetch team data
  useEffect(() => {
    if (!token) return;
    fetch('/api/reel-the-vibe/teams', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.data?.team) {
          const team = d.data.team;
          const memberData = (team.members || []).map((m: { photo_url: string; members: { full_name: string } | { full_name: string }[] }) => {
            const member = Array.isArray(m.members) ? m.members[0] : m.members;
            return { name: member?.full_name || 'Unknown', photo: m.photo_url || '/backdrop.jpg' };
          });
          setPlayers(memberData);
          setTeamName(team.team_name || initialsName(memberData));
          try {
            const clue = JSON.parse(team.assigned_song || '{}');
            setAssignedClue({ headline: clue.headline || '', songs: clue.songs || '', theme: clue.theme || '' });
          } catch {
            setAssignedClue({ headline: team.assigned_song || '', songs: '', theme: '' });
          }
        }
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const update = () => setVh(window.innerHeight / 100);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    return () => { if (reelPreview) URL.revokeObjectURL(reelPreview); };
  }, [reelPreview]);

  const scrollVh = vh > 0 ? scrollY / vh : 0;

  // Card progress: 0=hidden, 0→1=entering, 1=settled
  const getCardProgress = (idx: number) => {
    const startVh = 50 + idx * 100;
    const endVh = startVh + 80;
    if (scrollVh < startVh) return 0;
    if (scrollVh > endVh) return 1;
    return (scrollVh - startVh) / (endVh - startVh);
  };

  // Section 2 — info components enter (parallax from below)
  const section2Progress = (() => {
    const start = 380;
    const end = 460;
    if (scrollVh < start) return 0;
    if (scrollVh > end) return 1;
    return (scrollVh - start) / (end - start);
  })();

  // Cards scroll up and disappear
  const cardsExitProgress = (() => {
    if (scrollVh < 350) return 0;
    return Math.min(1, (scrollVh - 350) / 100);
  })();

  // Intro text
  const introOpacity = (() => {
    if (scrollVh < 20) return 1;
    if (scrollVh > 50) return 0;
    return 1 - (scrollVh - 20) / 30;
  })();

  const allSettled = players.every((_, i) => getCardProgress(i) >= 1);

  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

  const saveTeamName = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed) setTeamName(trimmed);
    else setEditValue(teamName);
    setEditing(false);
  }, [editValue, teamName]);

  const handleCardMouse = useCallback((e: React.MouseEvent, idx: number) => {
    const card = cardRefs.current[idx];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty('--tilt-x', `${-y * 8}deg`);
    card.style.setProperty('--tilt-y', `${x * 8}deg`);
  }, []);

  const handleCardLeave = useCallback((idx: number) => {
    const card = cardRefs.current[idx];
    if (!card) return;
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
    setHoveredCard(null);
  }, []);

  const handleReelFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('video/')) { setUploadError('Only video files allowed'); return; }
    if (file.size > 100 * 1024 * 1024) { setUploadError('Video must be under 100MB'); return; }
    setReelFile(file);
    setReelPreview(URL.createObjectURL(file));
  };

  const handleReelSubmit = async () => {
    if (!reelFile || !token || reelSubmitted) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('video', reelFile);
      await new Promise(r => setTimeout(r, 2000));
      setReelSubmitted(true);
      setReelUrl(reelPreview);
    } catch {
      setUploadError('Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const getCardStyle = (idx: number) => {
    const progress = getCardProgress(idx);
    const eased = easeOut(progress);
    const isHovered = hoveredCard === idx;
    const isOtherHovered = hoveredCard !== null && hoveredCard !== idx;
    const isCenter = idx === 2;

    const finalX = idx === 0 ? -1 : idx === 1 ? 1 : 0;
    const finalYOffset = idx === 2 ? -15 : 30;
    const finalScale = idx === 2 ? 1.0 : 0.9;
    const finalRotateY = idx === 0 ? 6 : idx === 1 ? -6 : 0;

    const vw = typeof globalThis.window !== 'undefined' ? window.innerWidth : 1200;
    const translateXpx = eased * finalX * Math.min(260, vw * 0.22);
    const translateYvh = (1 - eased) * 120;
    const yOffset = eased * finalYOffset;
    const scale = 0.85 + eased * (finalScale - 0.85);
    const rotateY = eased * finalRotateY;

    // Exit: cards move up
    const exitY = cardsExitProgress * -120;

    return {
      transform: `translate(calc(-50% + ${translateXpx}px), calc(-50% + ${yOffset}px + ${translateYvh}vh + ${exitY}vh)) scale(${scale}) rotateY(${rotateY}deg)${isCenter && progress >= 1 ? ' translateZ(40px)' : ''}`,
      opacity: progress === 0 ? 0 : cardsExitProgress > 0.8 ? 0 : isOtherHovered ? 0.7 : 1 - cardsExitProgress * 0.8,
      zIndex: (isCenter ? 30 : 10) + (isHovered ? 20 : 0),
      filter: !isCenter && !isHovered ? 'brightness(0.85)' : 'brightness(1)',
    };
  };

  // Info items parallax — each rises from below with stagger
  const getInfoItemStyle = (idx: number) => {
    const stagger = idx * 0.2;
    const itemProgress = Math.max(0, Math.min(1, (section2Progress - stagger) / (1 - stagger)));
    const eased = easeOut(itemProgress);
    return {
      opacity: eased,
      transform: `translateY(${(1 - eased) * 80}px)`,
    };
  };

  return (
    <div>
      <div style={{ height: `${TOTAL_HEIGHT}vh` }} />

      <div className="fixed inset-0 overflow-hidden" style={{ perspective: '1200px' }}>
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" src="/team.mp4" />
        <div className="absolute inset-0 bg-black/30" />

        {/* ===== SECTION 1: Intro + Cards ===== */}
        <div className="absolute inset-0 z-20" style={{ perspective: '1200px' }}>
          {/* Intro text */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
            style={{ opacity: introOpacity }}
          >
            <p className="font-display text-3xl sm:text-4xl md:text-5xl font-medium text-center px-8" style={{ color: '#E8DFD2', textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}>
              Scroll to unveil your Team
            </p>
            <ChevronDown size={28} className="mt-6 animate-bounce" style={{ color: '#B98255' }} />
          </div>

          {/* Cards */}
          {players.map((player, idx) => {
            const progress = getCardProgress(idx);
            const cardStyle = getCardStyle(idx);
            const isHovered = hoveredCard === idx;
            const isCenter = idx === 2;

            return (
              <div
                key={idx}
                ref={el => { cardRefs.current[idx] = el; }}
                className="absolute left-1/2 top-[45%]"
                style={{
                  ...cardStyle,
                  transformStyle: 'preserve-3d',
                  willChange: 'transform, opacity',
                  transition: 'filter 0.3s ease',
                }}
                onMouseEnter={() => allSettled && cardsExitProgress === 0 && setHoveredCard(idx)}
                onMouseMove={(e) => cardsExitProgress === 0 && handleCardMouse(e, idx)}
                onMouseLeave={() => handleCardLeave(idx)}
              >
                <div
                  className="relative overflow-hidden transition-all duration-500"
                  style={{
                    width: isCenter ? 'min(220px, 40vw)' : 'min(200px, 36vw)',
                    borderRadius: '16px',
                    background: 'linear-gradient(170deg, rgba(21,18,14,0.85) 0%, rgba(11,10,8,0.9) 100%)',
                    border: `1px solid ${isHovered ? 'rgba(185,130,85,0.5)' : 'rgba(90,81,70,0.3)'}`,
                    boxShadow: isHovered
                      ? '0 30px 60px rgba(0,0,0,0.6), 0 0 30px rgba(185,130,85,0.12), inset 0 1px 0 rgba(232,223,210,0.06)'
                      : '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(232,223,210,0.03)',
                    backdropFilter: 'blur(12px)',
                    transform: progress >= 1 && cardsExitProgress === 0
                      ? `rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)) ${isHovered ? 'scale(1.05) translateZ(20px)' : ''}`
                      : undefined,
                  }}
                >
                  <div
                    className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay z-10"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
                  />
                  <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={player.photo} alt={player.name} className="w-full h-full object-cover transition-all duration-500" style={{ filter: isHovered ? 'brightness(1.1) contrast(1.05)' : isCenter ? 'brightness(1)' : 'brightness(0.9)' }} />
                    <div className="absolute inset-x-0 bottom-0 h-1/3" style={{ background: 'linear-gradient(to top, rgba(11,10,8,0.95), transparent)' }} />
                    {isHovered && <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 80%, rgba(185,130,85,0.12), transparent 60%)' }} />}
                  </div>
                  <div className="relative px-3 py-2 sm:px-4 sm:py-3 text-center">
                    <p className="font-display text-xs sm:text-sm font-medium tracking-wide truncate" style={{ color: '#E8DFD2' }}>{player.name}</p>
                    <div className="w-6 h-px mx-auto mt-1.5" style={{ background: 'linear-gradient(to right, transparent, #B98255, transparent)' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ===== SECTION 2: Structured layout ===== */}
        <div
          className="absolute inset-0 z-30 pointer-events-none"
          style={{ opacity: section2Progress > 0 ? 1 : 0 }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto overflow-y-auto" style={{ padding: '4vh 0' }}>
            <div className="w-full max-w-3xl px-4 sm:px-6 flex flex-col gap-4 md:gap-5">

              {/* TEAM — top center */}
              <div style={getInfoItemStyle(0)} className="flex justify-center">
                <div
                  className="px-6 py-4 md:px-8 md:py-5 rounded-2xl text-center"
                  style={{
                    background: 'rgba(11,10,8,0.75)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(185,130,85,0.25)',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                    minWidth: '180px',
                  }}
                >
                  <span className="text-[10px] uppercase tracking-[3px] font-medium block mb-2" style={{ color: '#B98255' }}>Team</span>
                  {editing ? (
                    <div className="flex items-center justify-center gap-2">
                      <input
                        ref={inputRef}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value.slice(0, 10))}
                        onBlur={saveTeamName}
                        onKeyDown={e => { if (e.key === 'Enter') saveTeamName(); }}
                        className="bg-transparent border-b-2 text-center font-display text-2xl md:text-3xl outline-none"
                        style={{ color: '#E8DFD2', borderColor: '#B98255', caretColor: '#B98255', width: `${Math.max(3, editValue.length + 1)}ch` }}
                      />
                      <button onClick={saveTeamName} className="p-1" style={{ color: '#B98255' }}><Check size={16} /></button>
                    </div>
                  ) : (
                    <div className="relative flex items-center justify-center group cursor-pointer" onClick={() => { setEditValue(teamName); setEditing(true); }}>
                      <h2 className="font-display text-2xl md:text-3xl font-medium tracking-wider text-center" style={{ color: '#E8DFD2', textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
                        {teamName}
                      </h2>
                      <Pencil size={14} className="absolute -right-5 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: '#B98255' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* CLUE + REEL — side by side on desktop, stacked on mobile */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-5 md:items-start">

                {/* YOUR CLUE — 60-65% on desktop */}
                <div style={getInfoItemStyle(1)} className="w-full md:flex-[3]">
                  <div
                    className="px-5 py-5 md:px-6 md:py-6 rounded-2xl"
                    style={{
                      background: 'rgba(11,10,8,0.75)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(90,81,70,0.2)',
                      boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                    }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Music size={14} style={{ color: '#B98255' }} />
                      <span className="text-[10px] uppercase tracking-[2.5px] font-medium" style={{ color: '#B98255' }}>Your Clue</span>
                    </div>
                    {assignedClue.headline && (
                      <p className="font-display text-lg md:text-xl font-medium tracking-wide mb-2 text-center" style={{ color: '#E8DFD2' }}>
                        {assignedClue.headline}
                      </p>
                    )}
                    {assignedClue.songs && (
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(185,130,85,0.3))' }} />
                        <p className="text-xs tracking-wider shrink-0" style={{ color: '#B98255' }}>
                          {assignedClue.songs}
                        </p>
                        <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(185,130,85,0.3))' }} />
                      </div>
                    )}
                    {assignedClue.theme && (
                      <div
                        className="overflow-y-auto rounded-xl px-3 py-3"
                        style={{
                          maxHeight: '28vh',
                          background: 'rgba(0,0,0,0.2)',
                          border: '1px solid rgba(90,81,70,0.1)',
                        }}
                      >
                        <p className="text-xs md:text-[13px] leading-relaxed tracking-wider whitespace-pre-line text-left" style={{ color: '#A9A095' }}>
                          {assignedClue.theme}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* YOUR REEL — 35-40% on desktop */}
                <div style={getInfoItemStyle(2)} className="w-full md:flex-[2]">
                  <div
                    className="px-5 py-5 md:px-6 md:py-6 rounded-2xl text-center"
                    style={{
                      background: 'rgba(11,10,8,0.75)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(90,81,70,0.2)',
                      boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                    }}
                  >
                    <span className="text-[10px] uppercase tracking-[3px] font-medium block mb-4" style={{ color: '#B98255' }}>
                      Your Reel
                    </span>

                    {reelSubmitted && reelUrl ? (
                      <div className="flex justify-center">
                        <div className="overflow-hidden" style={{ width: '100px', aspectRatio: '9/16', borderRadius: '12px', border: '1px solid rgba(90,81,70,0.3)' }}>
                          <video src={reelUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        </div>
                      </div>
                    ) : !reelFile ? (
                      <>
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="flex items-center gap-2.5 px-5 py-3 rounded-xl transition-all duration-300 mx-auto"
                          style={{ background: 'rgba(21,18,14,0.8)', border: '1px solid rgba(90,81,70,0.3)', color: '#E8DFD2' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(185,130,85,0.5)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(90,81,70,0.3)'; }}
                        >
                          <Upload size={16} style={{ color: '#B98255' }} />
                          <span className="text-sm font-medium tracking-wide">Upload Reel</span>
                        </button>
                        <div className="flex items-center justify-center gap-1.5 mt-2.5">
                          <AlertTriangle size={10} style={{ color: '#A9A095' }} />
                          <span className="text-[9px] tracking-wider" style={{ color: '#A9A095' }}>You can submit only once</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(90,81,70,0.3)' }}>
                          <video src={reelPreview!} muted className="w-full h-full object-cover" />
                        </div>
                        <button
                          onClick={handleReelSubmit}
                          disabled={uploading}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-display font-medium tracking-wide transition-all duration-300"
                          style={{ background: 'linear-gradient(135deg, #1A1611, #2A2118)', border: '1px solid rgba(185,130,85,0.35)', color: '#E8DFD2' }}
                          onMouseEnter={e => { if (!uploading) e.currentTarget.style.borderColor = 'rgba(185,130,85,0.6)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(185,130,85,0.35)'; }}
                        >
                          {uploading ? <Loader2 size={16} className="animate-spin" /> : 'Submit Reel'}
                        </button>
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle size={10} style={{ color: '#A9A095' }} />
                          <span className="text-[9px] tracking-wider" style={{ color: '#A9A095' }}>You can submit only once</span>
                        </div>
                      </div>
                    )}
                    {uploadError && <p className="text-xs mt-2" style={{ color: '#D4836A' }}>{uploadError}</p>}
                  </div>
                </div>
              </div>

            </div>
          </div>

          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleReelFile(f); }} />
        </div>
      </div>
    </div>
  );
}
