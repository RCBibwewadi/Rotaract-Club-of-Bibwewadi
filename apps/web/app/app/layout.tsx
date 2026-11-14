import type { Metadata, Viewport } from 'next';
import AppGate from '@/components/app/AppGate';
import AppUpdater from '@/components/app/AppUpdater';

// The members' app is a separate product from the website: it only runs in the
// installed PWA (see AppGate) and must never appear in search results.
export const metadata: Metadata = {
  title: 'RCB',
  robots: { index: false, follow: false },
};

// The app is a native-feeling shell, not a document: pinch and double-tap
// zoom would drag its fixed chrome around. The website keeps normal zoom.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell bg-app-canvas text-app-plum">
      <AppUpdater />
      <AppGate>{children}</AppGate>
    </div>
  );
}
