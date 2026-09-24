/**
 * Ae Haalo 4.0 — Garba Workshop, 26 September 2026.
 *
 * One place for the details the event page, the API route and the home /
 * events cards all need to agree on. The event row itself lives in the
 * `events` table in Supabase; this holds the bits that table has no columns
 * for (fee, UPI payee, registration cutoff, the /aehalo4 route).
 */

export const GARBA_SLUG = 'garba-workshop-2026';
export const GARBA_PATH = '/aehalo4';

export const GARBA = {
  title: 'Garba Workshop',
  subtitle: 'Ae Haalo 4.0',
  /** Matches `event_date` on the row in the `events` table. */
  date: '2026-09-26',
  timeLabel: '7:00 PM onwards',
  venue: 'Deshpande Garden, Sinhagad Road, Pune',
  feeInr: 149,
  headerSubtext: '26 September 2026 · 7 PM · Deshpande Garden, Sinhagad Road',
  description:
    'A Navratri Garba workshop by the Rotaract Club of Bibwewadi. Learn the steps, feel the beat and get ready for the festive nights ahead. All skill levels welcome.',
  poster: '/events/garba-workshop-2026.jpg',
  posterAlt: 'Ae Haalo 4.0 Garba Workshop poster — 26 September 2026, Deshpande Garden, Sinhagad Road, Pune',
  dressCode: 'Traditionals',
} as const;

export const UPI = {
  payee: 'Anisha Shah',
  vpa: 'anisha17.india@oksbi',
} as const;

/** `upi://` deep link — same URI behind the QR code and the "pay" button. */
export const UPI_URI =
  `upi://pay?pa=${UPI.vpa}&pn=${encodeURIComponent(UPI.payee)}` +
  `&am=${GARBA.feeInr}&cu=INR&tn=${encodeURIComponent('RCB Garba Workshop')}`;

/**
 * Registrations close at 26 Sep 2026, 23:59:59 IST. Written as a UTC instant
 * so it means the same thing on the server (UTC on Vercel) and in a browser
 * in any timezone.
 */
export const REGISTRATION_CLOSES_AT = new Date('2026-09-26T18:29:59.000Z');

export function registrationsClosed(now: Date = new Date()): boolean {
  return now.getTime() > REGISTRATION_CLOSES_AT.getTime();
}
