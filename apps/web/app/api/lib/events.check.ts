/**
 * Self-check for the event registration tallies. The repo has no test runner,
 * so this runs on Node directly:
 *
 *   npx tsx apps/web/app/api/lib/events.check.ts
 *
 * It prints nothing and exits 0 when everything holds.
 */
import assert from 'node:assert/strict';
import { EVENT_CATEGORIES, DEFAULT_EVENT_CATEGORY, shapeEventCounts } from './events.ts';

const ME = 'me';
const row = (regs: { member_id: string }[] | null, strength: number | null = null) => ({
  event_id: 'e1',
  event_strength: strength,
  event_registrations: regs,
});

assert.equal(shapeEventCounts(row([]), ME).attending_count, 0);
assert.equal(shapeEventCounts(row([]), ME).my_registration, false);
assert.equal(shapeEventCounts(row(null), ME).attending_count, 0);

// One-tap registrations mark the viewer but do not count.
const tapped = shapeEventCounts(row([{ member_id: ME }, { member_id: 'other' }], 40), ME);
assert.equal(tapped.attending_count, 0);
assert.equal(tapped.my_registration, true);
// event_strength passes through untouched: it is the attended headcount.
assert.equal(tapped.event_strength, 40);

// A signed-out website visit gets counts but never a personal state.
assert.equal(shapeEventCounts(row([{ member_id: ME }]), null).my_registration, false);

// The registration rows must not travel to the client.
assert.ok(!('event_registrations' in shapeEventCounts(row([{ member_id: ME }]), ME)));
// Other fields survive untouched.
assert.equal(shapeEventCounts(row([]), ME).event_id, 'e1');
assert.equal(shapeEventCounts(row([]), ME).event_strength, null);

// Every form submission counts, as on the admin's registration forms.
const withForm = shapeEventCounts(
  {
    ...row([]),
    registration_forms: [
      { registrations: [{ member_id: ME }, { member_id: null }, { member_id: 'x' }] },
      { registrations: [{ member_id: null }] },
    ],
  },
  ME,
);
assert.equal(withForm.attending_count, 4);
assert.equal(withForm.my_registration, true);
assert.ok(!('registration_forms' in withForm));

assert.equal(EVENT_CATEGORIES.length, 4);
assert.ok(EVENT_CATEGORIES.includes(DEFAULT_EVENT_CATEGORY));
assert.equal(DEFAULT_EVENT_CATEGORY, 'Club Service');
