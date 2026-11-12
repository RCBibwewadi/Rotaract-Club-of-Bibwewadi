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

const two = shapeEventCounts(row([{ member_id: ME }, { member_id: 'other' }], 40), ME);
assert.equal(two.attending_count, 2);
assert.equal(two.my_registration, true);
assert.equal(two.capacity, 40);

// A signed-out website visit gets counts but never a personal state.
assert.equal(shapeEventCounts(row([{ member_id: ME }]), null).my_registration, false);

// The registration rows must not travel to the client.
assert.ok(!('event_registrations' in shapeEventCounts(row([{ member_id: ME }]), ME)));
// Other fields survive untouched.
assert.equal(shapeEventCounts(row([]), ME).event_id, 'e1');
// No cap set means no cap, not zero.
assert.equal(shapeEventCounts(row([]), ME).capacity, null);

assert.equal(EVENT_CATEGORIES.length, 4);
assert.ok(EVENT_CATEGORIES.includes(DEFAULT_EVENT_CATEGORY));
assert.equal(DEFAULT_EVENT_CATEGORY, 'Club Service');
