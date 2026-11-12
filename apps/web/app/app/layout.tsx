import type { Metadata } from 'next';
import AppGate from '@/components/app/AppGate';

// The members' app is a separate product from the website: it only runs in the
// installed PWA (see AppGate) and must never appear in search results.
export const metadata: Metadata = {
  title: 'RCB',
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-app-canvas text-app-plum">
      <AppGate>{children}</AppGate>
    </div>
  );
}
