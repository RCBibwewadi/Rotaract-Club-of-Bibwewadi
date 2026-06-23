'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { useStore } from '@/lib/store';

interface UpcomingEvent {
  event_id: string;
  event_name: string;
  event_date?: string;
  event_time?: string;
  event_place?: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

const DISMISS_KEY = 'rcb-upnext-dismissed';
const SHOW_ON = ['/', '/join'];

export default function UpNextPill() {
  const [event, setEvent] = useState<UpcomingEvent | null>(null);
  const [ready, setReady] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [dismissed, setDismissed] = useState(() =>
    typeof window !== 'undefined' && sessionStorage.getItem(DISMISS_KEY) === '1'
  );
  const dismissedRef = useRef(dismissed);
  const isDark = useStore((s) => s.isDark);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (dismissedRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/events/upcoming');
        const data = await res.json();
        const events = data.data || [];
        if (!cancelled) {
          if (events.length > 0) setEvent(events[0]);
          setReady(true);
        }
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleDismiss = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setDismissing(true);
    sessionStorage.setItem(DISMISS_KEY, '1');
    setTimeout(() => setDismissed(true), 300);
  };

  const handleNav = () => {
    router.push('/events');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNav();
    }
  };

  const handleDismissKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDismiss(e);
    }
  };

  if (dismissed || !ready || !SHOW_ON.includes(pathname)) return null;

  const visible = ready && !dismissing;
  const inset = 'clamp(16px, 3vw, 32px)';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleNav}
      onKeyDown={handleKeyDown}
      aria-label="Upcoming event teaser — click to see events"
      style={{ bottom: inset, left: inset }}
      className={`
        fixed z-[9999] max-w-xs cursor-pointer
        transition-all duration-500 ease-out
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}
      `}
    >
      <div className={`
        relative flex items-start gap-3 px-4 py-3.5 rounded-2xl
        border backdrop-blur-xl shadow-lg
        ${isDark
          ? 'bg-white/90 border-white/20 shadow-black/30'
          : 'bg-dark/90 border-dark/20 shadow-black/20'
        }
      `}>
        {/* Pulsing equalizer icon */}
        <div className="relative flex-shrink-0 mt-0.5">
          <div className="flex items-end gap-[3px] h-4">
            <span className="w-[3px] bg-accent rounded-full motion-safe:animate-[eq1_1s_ease-in-out_infinite]" style={{ height: '60%' }} />
            <span className="w-[3px] bg-accent rounded-full motion-safe:animate-[eq2_1.2s_ease-in-out_infinite]" style={{ height: '100%' }} />
            <span className="w-[3px] bg-accent rounded-full motion-safe:animate-[eq3_0.9s_ease-in-out_infinite]" style={{ height: '40%' }} />
          </div>
          {/* Ping ring */}
          <div className="absolute -inset-1.5 rounded-full border border-accent/30 motion-safe:animate-ping" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent">
            Save the date
          </p>
          <p className={`text-sm font-medium mt-0.5 ${isDark ? 'text-dark' : 'text-white'}`}>
            Something&apos;s being planned...
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-dark/50' : 'text-white/50'}`}>
            {event?.event_date ? formatDate(event.event_date) : 'Coming soon'} &middot; find out what &rarr;
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          onKeyDown={handleDismissKeyDown}
          aria-label="Dismiss event teaser"
          className={`
            flex-shrink-0 p-1 rounded-full transition-colors
            ${isDark ? 'text-dark/30 hover:text-dark/60 hover:bg-dark/10' : 'text-white/30 hover:text-white/60 hover:bg-white/10'}
          `}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
