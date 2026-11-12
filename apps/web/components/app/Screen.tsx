'use client';

import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { initials } from '@/lib/app/format';
import PullToRefresh, { refreshApp } from './PullToRefresh';

/**
 * Page chrome for every tab: a title bar that clears the status bar, and a
 * scroll area that clears the bottom nav.
 */
export function Screen({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const body = (
    <>
      <header
        className="sticky top-0 z-30 border-b border-black/5 bg-app-canvas/90 px-5 pb-3 backdrop-blur-lg"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight text-app-plum">{title}</h1>
            {subtitle && <p className="mt-0.5 truncate text-sm text-app-plum/50">{subtitle}</p>}
          </div>
          {/* The pull gesture is the main way to refresh; this covers anyone
              who does not think to pull, and pointers that cannot. */}
          <button
            type="button"
            onClick={refreshApp}
            aria-label="Refresh"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-app-plum/5 text-app-plum/55"
          >
            <RefreshCw size={16} aria-hidden />
          </button>
          {action}
        </div>
      </header>

      {/* 5.5rem clears the fixed bottom nav plus the home indicator. */}
      <main className="px-4 pt-4" style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}>
        {children}
      </main>
    </>
  );

  return (
    <div className="min-h-screen bg-app-canvas">
      <PullToRefresh>{body}</PullToRefresh>
    </div>
  );
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-app-plum/40" role="status">
      <Loader2 size={24} className="animate-spin" aria-hidden />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center" role="alert">
      <AlertCircle size={24} className="text-accent" aria-hidden />
      <p className="text-sm text-app-plum/70">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-app-plum px-5 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-10 text-center">
      <p className="text-base font-semibold text-app-plum">{title}</p>
      <p className="max-w-xs text-sm text-app-plum/50">{body}</p>
      {action && <div className="pt-3">{action}</div>}
    </div>
  );
}

/** Initials bubble used wherever a member has no avatar image. */
export function Avatar({
  name,
  src,
  size = 36,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  if (src) {
    return (
      // Member avatars come from Supabase storage at unknown sizes; a plain
      // img keeps next/image's remote-host config out of this.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-accent/10 font-semibold text-accent"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  );
}
