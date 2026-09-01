import type { Metadata } from 'next';

// The real registration form lives here, reachable only by tapping "Join Us" in
// the navbar ten times inside fifteen seconds. Keep it out of search results:
// it is not in the sitemap either, and deliberately not in robots.txt — listing
// a path there would broadcast the one thing that is supposed to stay quiet.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SecretJoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
