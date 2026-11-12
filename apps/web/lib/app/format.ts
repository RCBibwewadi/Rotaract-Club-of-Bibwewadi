/**
 * Pure formatting helpers for the mobile app. Kept free of React and of path
 * aliases so they can be exercised directly by lib/app/format.check.ts.
 */

/** "3h ago" — short relative time for feed cards. Anything older than a week
 *  becomes an absolute date, which reads better than "63d ago". */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const seconds = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Digits only, with India's country code when the number is a bare 10 digits —
 * members store phones both ways, and wa.me rejects anything else.
 */
export function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? `91${digits}` : digits;
}

/** "Priya Sharma" -> "PS", for avatars with no image. */
export function initials(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}
