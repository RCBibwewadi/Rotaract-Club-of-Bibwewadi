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
  event_registrations ( member_id ),
  registration_forms ( registrations ( member_id ) )
`;

export interface EventCounts {
  attending_count: number;
  /** True once the caller has registered; false for a signed-out website visit. */
  my_registration: boolean;
}

interface RawCounts {
  event_strength?: number | null;
  event_registrations?: { member_id: string }[] | null;
  /** Forms linked to the event; their submissions are the attending count. */
  registration_forms?: { registrations: { member_id: string | null }[] | null }[] | null;
}

/**
 * Collapses the registration rows into counts. The rows themselves never reach
 * the client: who registered is the admin's business, not every member's.
 */
export function shapeEventCounts<T extends RawCounts>(
  row: T,
  viewerId: string | null,
): Omit<T, 'event_registrations' | 'registration_forms'> & EventCounts {
  // Same tally as the admin's registration forms: every form submission.
  const formRows = (row.registration_forms ?? []).flatMap((f) => f.registrations ?? []);
  const mine = (r: { member_id: string | null }) => !!viewerId && r.member_id === viewerId;
  const rest = { ...row };
  delete rest.event_registrations;
  delete rest.registration_forms;
  return {
    ...rest,
    attending_count: formRows.length,
    my_registration: [...(row.event_registrations ?? []), ...formRows].some(mine),
  };
}
