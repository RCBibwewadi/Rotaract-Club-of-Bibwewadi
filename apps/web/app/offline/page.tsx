import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offline',
  description: 'You are offline.',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-light dark:bg-dark">
      <div className="max-w-md text-center">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight gradient-text">
          You&apos;re offline
        </h1>
        <div className="fade-rule my-8" />
        <p className="text-base opacity-70">
          This page needs a connection. Check your network and try again — the Rotaract Club of
          Bibwewadi app will pick up right where you left off.
        </p>
        {/* plain <a>: a client-side <Link> would re-run the failed RSC fetch while still offline */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="inline-block mt-8 rounded-full px-6 py-3 text-sm font-medium text-white bg-accent hover:bg-accent-light transition-colors"
        >
          Try again
        </a>
      </div>
    </main>
  );
}
