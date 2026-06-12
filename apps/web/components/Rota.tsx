'use client';

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { X, MessageCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import RotaAvatar from './RotaAvatar';

/* ─────────────────────────────────────────────
   Section-aware narration map
   key  = data-rota attribute value on <section>
   value = one-liner Rota speaks
   ───────────────────────────────────────────── */
const SECTION_HINTS: Record<string, string> = {
  // Home
  'home-hero': "This is our landing zone — feel the energy! 🎶",
  'home-pillars': "These four pillars guide everything we do. 🌟",
  'home-vision': "Our north star — the vision that drives us forward. 🧭",
  'home-explore': "Dive deeper into projects, events & our amazing board! 🚀",
  'home-cta': "Ready to make a difference? Join the family! 🤝",
  // About
  'about-hero': "Here's where our story begins… 📖",
  'about-content': "This is who we are and what we believe in. 💛",
  'about-vision': "Our vision for a better tomorrow. ✨",
  'about-pillars': "The four pillars that hold us strong. 🏛️",
  'about-stats': "Numbers that speak louder than words! 📊",
  // Projects
  'projects-hero': "Welcome to our project gallery! 🎨",
  'projects-grid': "Browse our impactful work — filter by category! 🔍",
  // Events
  'events-hero': "Stay in the loop with all our events! 📅",
  'events-list': "Here's what's happening — don't miss out! 🎉",
  // Board
  'board-hero': "Meet the passionate leaders behind RCB! 👥",
  'board-grid': "Hover over a card to learn more about each director. ✨",
  // Join
  'join-hero': "We'd love to have you on board! 🎊",
  'join-form': "Fill this out — it only takes a minute! 📝",
  // Contact
  'contact-hero': "Have something to say? We're all ears! 👂",
  'contact-form': "Drop us a message — we'll get back fast! 💬",
};

/* Page-level narrations (shown on route change) */
const PAGE_HINTS: Record<string, string> = {
  '/': '', // handled by intro
  '/about': "Let me tell you our story! 📖",
  '/projects': "Check out the amazing work we've done! 🎯",
  '/events': "Here's our calendar — so much happening! 🗓️",
  '/board': "Meet the dream team running the show! 🌟",
  '/join': "Excited to have you! Let's get you signed up. 🎉",
  '/contact': "We'd love to hear from you! 💌",
};

/* ─────────────────────────────────────────────
   Typewriter hook
   ───────────────────────────────────────────── */
function useTypewriter(text: string, speed = 38, startDelay = 0) {
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // Reset then schedule each character
    timeouts.push(setTimeout(() => setCharCount(0), 0));
    if (text) {
      for (let i = 1; i <= text.length; i++) {
        timeouts.push(setTimeout(() => setCharCount(i), startDelay + i * speed));
      }
    }

    return () => timeouts.forEach(clearTimeout);
  }, [text, speed, startDelay]);

  return {
    displayed: text.slice(0, charCount),
    done: !text || charCount >= text.length,
  };
}

/* ─────────────────────────────────────────────
   Main Rota component
   ───────────────────────────────────────────── */
export default function Rota() {
  const { isDark } = useStore();
  const pathname = usePathname();

  // Lifecycle phases
  type Phase = 'idle' | 'intro-appear' | 'intro-typing' | 'intro-done' | 'transitioning';
  const [phase, setPhase] = useState<Phase>('idle');
  const [hasIntroPlayed, setHasIntroPlayed] = useState(true);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Widget state
  const [bubble, setBubble] = useState('');
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [minimised, setMinimised] = useState(false); // user explicitly closed
  const bubbleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastHint = useRef('');

  // Track which sections are in view
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ── Bubble helpers ──
  const showBubble = useCallback((text: string) => {
    if (minimised) return;
    lastHint.current = text;
    setBubble(text);
    setBubbleVisible(true);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubbleVisible(false), 4500);
  }, [minimised]);

  // ── Intro sequence (Home only, first visit) ──
  const introLine1 = "Hi, I'm Rota! 👋";
  const introLine2 = "Welcome to the RCB Family ✨";
  const [introStep, setIntroStep] = useState<1 | 2>(1);

  const line1 = useTypewriter(
    phase === 'intro-typing' && introStep >= 1 ? introLine1 : '',
    42,
    400
  );
  const line2 = useTypewriter(
    phase === 'intro-typing' && introStep === 2 ? introLine2 : '',
    42,
    200
  );

  // Intro removed — splash screen handles welcome

  // Step from line1 → line2
  useEffect(() => {
    if (line1.done && introStep === 1) {
      const t = setTimeout(() => setIntroStep(2), 500);
      return () => clearTimeout(t);
    }
  }, [line1.done, introStep]);

  // After line2 done → transition out
  useEffect(() => {
    if (line2.done && phase === 'intro-typing' && introStep === 2) {
      const t = setTimeout(() => {
        setPhase('transitioning');
        setTimeout(() => {
          setPhase('idle');
          setHasIntroPlayed(true);
        }, 900);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [line2.done, phase, introStep]);

  // ── Show page narration on route change (not home if intro hasn't played) ──
  useEffect(() => {
    if (phase !== 'idle') return;
    const hint = PAGE_HINTS[pathname];
    if (hint && hint !== lastHint.current) {
      showBubble(hint);
    }
  }, [pathname, phase, showBubble]);

  // ── Observe sections with data-rota ──
  const setupObserver = useCallback(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const key = (entry.target as HTMLElement).dataset.rota;
            if (key && SECTION_HINTS[key] && SECTION_HINTS[key] !== lastHint.current) {
              showBubble(SECTION_HINTS[key]);
            }
          }
        }
      },
      { threshold: 0.35, rootMargin: '-60px 0px -60px 0px' }
    );

    document.querySelectorAll('[data-rota]').forEach((el) => {
      observerRef.current?.observe(el);
    });
  }, [showBubble]);

  // Re-setup observer when route changes or phase becomes idle
  useEffect(() => {
    if (phase !== 'idle') return;
    // small delay so DOM has painted
    const t = setTimeout(setupObserver, 500);
    return () => {
      clearTimeout(t);
      observerRef.current?.disconnect();
    };
  }, [pathname, phase, setupObserver]);

  function handleAvatarClick() {
    if (minimised) {
      setMinimised(false);
      return;
    }
    if (bubbleVisible) {
      setBubbleVisible(false);
    } else if (bubble) {
      setBubbleVisible(true);
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(() => setBubbleVisible(false), 4500);
    }
  }

  // ── Don't render until mounted (prevents hydration mismatch) or on admin ──
  if (!mounted || pathname === '/admin') return null;

  const isIntro = phase === 'intro-appear' || phase === 'intro-typing' || phase === 'intro-done';
  const isTransitioning = phase === 'transitioning';
  const isWidget = phase === 'idle';

  return (
    <>
      {/* ═══════════ FLOATING WIDGET ═══════════ */}
      {isWidget && (
        <div
          className={`group/widget fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-3 transition-all duration-500 ${
            minimised ? 'opacity-50 hover:opacity-100' : 'opacity-100'
          }`}
        >
          {/* Speech bubble */}
          {bubbleVisible && !minimised && (
            <div
              className={`max-w-[280px] sm:max-w-xs p-4 rounded-2xl rounded-br-md shadow-2xl border transition-all duration-400 ${
                isDark
                  ? 'bg-dark-card border-white/10 text-white'
                  : 'bg-white border-black/10 text-dark'
              }`}
              style={{
                animation: 'rotaBubbleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
              }}
            >
              <div className="flex items-start gap-2">
                <p className="text-sm leading-relaxed flex-1">{bubble}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setBubbleVisible(false); }}
                  className={`shrink-0 p-0.5 rounded-full transition-colors ${isDark ? 'text-white/30 hover:text-white/60' : 'text-dark/30 hover:text-dark/60'}`}
                >
                  <X size={12} />
                </button>
              </div>
              {/* Tail */}
              <div
                className={`absolute -bottom-2 right-5 w-4 h-4 rotate-45 border-r border-b ${
                  isDark ? 'bg-dark-card border-white/10' : 'bg-white border-black/10'
                }`}
              />
            </div>
          )}

          {/* Avatar button */}
          <button
            onClick={handleAvatarClick}
            className="group relative w-14 h-14 rounded-full overflow-hidden shadow-xl shadow-accent/20 border-2 border-accent/50 hover:border-accent transition-all duration-300 hover:scale-110 active:scale-95 rota-pulse"
            aria-label="Rota assistant"
            style={{
              animation: isWidget && !hasIntroPlayed ? 'none' : 'rotaSlideIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
            }}
          >
            <RotaAvatar size={56} className="w-full h-full" />
            {/* Glow ring on bubble active */}
            {bubbleVisible && (
              <div className="absolute inset-0 rounded-full border-2 border-accent animate-ping opacity-30" />
            )}
          </button>

          {/* Minimise / Close button */}
          {!minimised && (
            <button
              onClick={(e) => { e.stopPropagation(); setMinimised(true); setBubbleVisible(false); }}
              className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all opacity-0 group-hover/widget:opacity-100 ${
                isDark ? 'bg-dark-surface text-white/50 hover:text-white border border-white/10' : 'bg-light-surface text-dark/50 hover:text-dark border border-black/10'
              }`}
              aria-label="Minimise Rota"
            >
              <X size={10} />
            </button>
          )}

          {/* Minimised indicator */}
          {minimised && (
            <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
              <MessageCircle size={10} className="text-white" />
            </div>
          )}
        </div>
      )}
    </>
  );
}
