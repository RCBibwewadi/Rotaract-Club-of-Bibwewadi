'use client';

import { useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { checkForAppUpdate } from '@/lib/app/update';
import { refreshAll } from '@/lib/app/refresh';

/** How far the finger must travel before a release refreshes. */
const THRESHOLD = 70;
/** Pull feels heavier than the finger moves, and stops growing past this. */
const RESISTANCE = 2.4;
const MAX_PULL = 96;

/** One refresh for the whole app: every mounted screen refetches, and the
 *  app re-checks whether a newer build has been deployed. */
export function refreshApp() {
  refreshAll();
  void checkForAppUpdate();
}

/**
 * Pull-to-refresh for the app's screens.
 *
 * An installed PWA has no browser chrome, so it has no pull-to-refresh of its
 * own — without this there is no way for a member to ask for fresh data short
 * of switching tabs.
 */
export default function PullToRefresh({
  children,
  className,
}: {
  children: React.ReactNode;
  /** The app shell passes the scroll-area classes; this div is the scroller. */
  className?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState(0);
  // Mirrors startY as state: render needs to know whether the finger is still
  // down, and a ref cannot be read while rendering.
  const [dragging, setDragging] = useState(false);
  const startY = useRef<number | null>(null);

  const atTop = () => (scroller.current?.scrollTop ?? 0) <= 0;

  const start = (e: React.TouchEvent) => {
    // Only from the very top, and never inside an open sheet, which does its
    // own scrolling.
    if (!atTop()) return;
    if ((e.target as HTMLElement).closest('[role="dialog"]')) return;
    startY.current = e.touches[0].clientY;
    setDragging(true);
  };

  const move = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const distance = e.touches[0].clientY - startY.current;

    // An upward move, or a page that has scrolled, means this is an ordinary
    // scroll after all.
    if (distance <= 0 || !atTop()) {
      startY.current = null;
      setDragging(false);
      setPull(0);
      return;
    }

    setPull(Math.min(distance / RESISTANCE, MAX_PULL));
  };

  const end = () => {
    if (pull >= THRESHOLD) refreshApp();
    startY.current = null;
    setDragging(false);
    setPull(0);
  };

  const armed = pull >= THRESHOLD;

  return (
    <div
      ref={scroller}
      className={className}
      onTouchStart={start}
      onTouchMove={move}
      onTouchEnd={end}
      onTouchCancel={end}
    >
      <div
        aria-hidden
        className="pointer-events-none flex items-end justify-center overflow-hidden"
        style={{
          height: pull,
          // Springing back is animated; following the finger is not.
          transition: dragging ? 'none' : 'height 200ms ease-out',
        }}
      >
        <RefreshCw
          size={20}
          className={`mb-2 text-app-plum/40 ${armed ? 'text-app-pink' : ''}`}
          style={{ transform: `rotate(${pull * 3}deg)`, opacity: Math.min(pull / THRESHOLD, 1) }}
        />
      </div>
      {children}
    </div>
  );
}
