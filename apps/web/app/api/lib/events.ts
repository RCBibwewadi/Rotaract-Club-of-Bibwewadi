/**
 * The four Rotaract avenues, which the app uses as event categories. They are
 * stored in events.event_avenue — an older free-text column, so an event
 * created on the website may hold something else; the app shows those under
 * "All" only.
 */
export const EVENT_CATEGORIES = [
  'Community Service',
  'Professional Development',
  'Club Service',
  'International Service',
] as const;

export const DEFAULT_EVENT_CATEGORY: (typeof EVENT_CATEGORIES)[number] = 'Club Service';

/** The columns the app's event list needs, on top of the website's. */
export const APP_EVENT_COLUMNS = `
  event_strength,
  registration_enabled,
  event_registrations ( member_id )
`;

export interface EventCounts {
  attending_count: number;
  /** True once the caller has registered; false for a signed-out website visit. */
  my_registration: boolean;
  /** Null when the event has no cap. */
  capacity: number | null;
}

interface RawCounts {
  event_strength?: number | null;
  event_registrations?: { member_id: string }[] | null;
}

/**
 * Collapses the registration rows into counts. The rows themselves never reach
 * the client: who registered is the admin's business, not every member's.
 */
export function shapeEventCounts<T extends RawCounts>(
  row: T,
  viewerId: string | null,
): Omit<T, 'event_registrations'> & EventCounts {
  const rows = row.event_registrations ?? [];
  const rest = { ...row };
  delete rest.event_registrations;
  return {
    ...rest,
    attending_count: rows.length,
    my_registration: !!viewerId && rows.some((r) => r.member_id === viewerId),
    capacity: row.event_strength ?? null,
  };
}
