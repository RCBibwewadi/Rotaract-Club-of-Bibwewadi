'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

/**
 * The "post something" action for a tab. It sits above the bottom bar rather
 * than in the title bar: on a phone the thumb reaches the bottom corner, not
 * the top one.
 */
export default function Fab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_6px_20px_rgba(139,26,43,0.35)] transition-colors hover:bg-accent-light"
      // Clears the tab bar (and the iPhone home indicator underneath it).
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.75rem)' }}
    >
      <Plus size={26} aria-hidden />
    </Link>
  );
}
