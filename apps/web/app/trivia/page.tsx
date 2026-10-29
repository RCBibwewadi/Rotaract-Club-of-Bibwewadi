'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Eye, Maximize, Pause, Play, Lock } from 'lucide-react';
import { TRIVIA_PHASES, type TriviaPhase } from '@rcb-2.0/shared';
import MediaBlock from '@/components/trivia/MediaBlock';
import Countdown from '@/components/trivia/Countdown';
import { PHASE_META, type TriviaQuestion } from '@/components/trivia/types';

const QUESTION_SECONDS = 20;
const LETTERS = ['A', 'B', 'C', 'D'];

type Screen =
  | { kind: 'title' }
  | { kind: 'intro'; phase: TriviaPhase }
  | { kind: 'question'; phase: TriviaPhase; index: number }
  | { kind: 'phaseEnd'; phase: TriviaPhase }
  | { kind: 'done' };

export default function TriviaPage() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/trivia/unlock').then(r => r.json()).then(d => setUnlocked(!!d.data?.unlocked)).catch(() => setUnlocked(false));
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0614] text-white select-none">
      <style>{`@keyframes trivia-eq{0%,100%{height:20%}50%{height:100%}}`}</style>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(217,70,239,0.25),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(251,191,36,0.15),transparent_60%)]" />
      <div className="relative">
        {unlocked === null ? null : unlocked ? <Game /> : <Gate onUnlock={() => setUnlocked(true)} />}
      </div>
    </main>
  );
}

function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/trivia/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) onUnlock();
    else setError('Wrong password');
  };

  return (
    <form onSubmit={submit} className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <Lock className="text-amber-300" size={48} />
      <h1 className="text-center text-5xl font-black tracking-tight">Trivia Proto</h1>
      <input type="password" autoFocus value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
        className="w-full max-w-sm rounded-xl border border-white/20 bg-white/5 px-5 py-4 text-xl outline-none focus:border-amber-300" />
      <button className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-amber-500 px-8 py-3 text-xl font-bold">Enter</button>
      {error && <p className="text-rose-400">{error}</p>}
    </form>
  );
}

function Game() {
  const [questions, setQuestions] = useState<TriviaQuestion[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [screen, setScreen] = useState<Screen>({ kind: 'title' });
  const [revealed, setRevealed] = useState(false);
  const [left, setLeft] = useState(QUESTION_SECONDS);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch('/api/trivia/questions')
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.message || d.error || 'Could not load questions');
        setQuestions(d.data);
      })
      .catch(e => setLoadError(e.message));
  }, []);

  const byPhase = useMemo(() => {
    const map = {} as Record<TriviaPhase, TriviaQuestion[]>;
    for (const p of TRIVIA_PHASES) map[p] = [];
    for (const q of questions || []) map[q.phase]?.push(q);
    return map;
  }, [questions]);
  const phases = TRIVIA_PHASES.filter(p => byPhase[p].length > 0);

  const current = screen.kind === 'question' ? byPhase[screen.phase][screen.index] : null;

  // Countdown ticks only while a question is up, unrevealed and unpaused.
  useEffect(() => {
    if (!current || revealed || paused || left <= 0) return;
    const t = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [current, revealed, paused, left]);

  const showQuestion = (phase: TriviaPhase, index: number) => {
    setRevealed(false);
    setPaused(false);
    setLeft(QUESTION_SECONDS);
    setScreen({ kind: 'question', phase, index });
  };

  const next = useCallback(() => {
    switch (screen.kind) {
      case 'title':
        setScreen(phases[0] ? { kind: 'intro', phase: phases[0] } : { kind: 'done' });
        break;
      case 'intro':
        showQuestion(screen.phase, 0);
        break;
      case 'question':
        if (!revealed) { setRevealed(true); break; }
        if (screen.index + 1 < byPhase[screen.phase].length) showQuestion(screen.phase, screen.index + 1);
        else setScreen({ kind: 'phaseEnd', phase: screen.phase });
        break;
      case 'phaseEnd': {
        const nextPhase = phases[phases.indexOf(screen.phase) + 1];
        setScreen(nextPhase ? { kind: 'intro', phase: nextPhase } : { kind: 'done' });
        break;
      }
      case 'done':
        setScreen({ kind: 'title' });
    }
  }, [screen, revealed, phases, byPhase]);

  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  // Host remote: → / Enter next, Space reveal, P pause, F fullscreen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
      else if (e.key === ' ') { e.preventDefault(); if (current) setRevealed(true); }
      else if (e.key.toLowerCase() === 'p') setPaused(p => !p);
      else if (e.key.toLowerCase() === 'f') fullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, current]);

  if (loadError) return <Centered><p className="text-2xl text-rose-400">{loadError}</p></Centered>;
  if (!questions) return <Centered><p className="text-2xl text-white/60">Loading…</p></Centered>;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Host bar */}
      <div className="flex items-center justify-between px-6 py-4 text-white/50">
        <span className="text-lg font-semibold tracking-widest text-amber-300/80">BOLLYWOOD TRIVIA</span>
        <div className="flex items-center gap-2">
          {current && (
            <>
              <HostButton onClick={() => setPaused(p => !p)} title="Pause (P)">{paused ? <Play size={20} /> : <Pause size={20} />}</HostButton>
              <HostButton onClick={() => setRevealed(true)} title="Reveal (Space)"><Eye size={20} /></HostButton>
            </>
          )}
          <HostButton onClick={fullscreen} title="Fullscreen (F)"><Maximize size={20} /></HostButton>
          <HostButton onClick={next} title="Next (→)"><ArrowRight size={20} /></HostButton>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10">
        {screen.kind === 'title' && (
          <div className="text-center">
            <p className="mb-4 text-2xl tracking-[0.4em] text-fuchsia-300">ROTARACT CLUB OF BIBWEWADI PRESENTS</p>
            <h1 className="bg-gradient-to-r from-amber-200 via-amber-400 to-fuchsia-400 bg-clip-text text-8xl font-black text-transparent md:text-9xl">
              Bollywood Trivia
            </h1>
            <p className="mt-10 text-xl text-white/40">Press → to begin</p>
          </div>
        )}

        {screen.kind === 'intro' && (
          <div className="text-center">
            <p className="text-2xl tracking-[0.4em] text-white/50">ROUND {phases.indexOf(screen.phase) + 1}</p>
            <div className="my-6 text-9xl">{PHASE_META[screen.phase].emoji}</div>
            <h2 className="text-7xl font-black text-amber-300 md:text-8xl">{PHASE_META[screen.phase].title}</h2>
            <p className="mt-6 text-3xl text-white/70">{PHASE_META[screen.phase].tagline}</p>
            <p className="mt-4 text-xl text-white/40">{byPhase[screen.phase].length} questions</p>
          </div>
        )}

        {screen.kind === 'question' && current && (
          <div className="flex w-full max-w-6xl flex-col items-center gap-8">
            <div className="flex w-full items-center justify-between">
              <span className="text-2xl text-white/50">
                {PHASE_META[screen.phase].title} · Q{screen.index + 1}/{byPhase[screen.phase].length}
              </span>
              <Countdown left={left} total={QUESTION_SECONDS} paused={paused} />
            </div>
            <h2 className="text-center text-5xl font-bold leading-tight md:text-6xl">{current.prompt}</h2>
            <MediaBlock key={current.id} q={current} />
            <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
              {current.options.map((opt, i) => {
                const correct = i === current.answer_index;
                const state = !revealed ? 'border-white/15 bg-white/5'
                  : correct ? 'border-emerald-400 bg-emerald-500/30 scale-[1.03]' : 'border-white/5 bg-white/[0.02] opacity-40';
                return (
                  <div key={i} className={`flex items-center gap-5 rounded-2xl border-2 px-6 py-5 text-3xl font-semibold transition-all duration-500 ${state}`}>
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-600 to-amber-500 text-2xl font-black">{LETTERS[i]}</span>
                    {opt}
                  </div>
                );
              })}
            </div>
            {left <= 0 && !revealed && <p className="text-3xl font-bold text-rose-400">Time&apos;s up!</p>}
          </div>
        )}

        {screen.kind === 'phaseEnd' && (
          <div className="text-center">
            <h2 className="text-7xl font-black text-amber-300">{PHASE_META[screen.phase].title}</h2>
            <p className="mt-6 text-4xl text-white/70">Round complete!</p>
            <p className="mt-10 text-xl text-white/40">Press → for the next round</p>
          </div>
        )}

        {screen.kind === 'done' && (
          <div className="text-center">
            <div className="text-9xl">🏆</div>
            <h2 className="mt-6 text-8xl font-black text-amber-300">That&apos;s a wrap!</h2>
            <p className="mt-6 text-3xl text-white/70">Picture abhi khatam hui, dost.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HostButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className="rounded-lg p-2 hover:bg-white/10 hover:text-white">{children}</button>;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center">{children}</div>;
}
