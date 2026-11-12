/**
 * Self-check for the referral shaping and validation. The repo has no test
 * runner, so this runs on Node directly:
 *
 *   node --experimental-strip-types apps/web/app/api/lib/referrals.check.ts
 *
 * It prints nothing and exits 0 when everything holds.
 */
import assert from 'node:assert/strict';
import { CreateReferralSchema, shapeReferral, type RawReferral } from './referrals.ts';

const ME = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';

const row = (overrides: Partial<RawReferral> = {}): RawReferral => ({
  referral_id: 'r1',
  title: 'Looking for a photographer',
  description: 'For the installation night.',
  location: 'Pune',
  budget: null,
  contact_method: 'phone',
  status: 'open',
  created_at: '2026-11-12T12:00:00Z',
  author: { member_id: OTHER, full_name: 'Asha', avatar_url: null },
  referral_interests: [],
  ...overrides,
});

// Interest is counted from the rows, and the viewer's own state is derived.
assert.equal(shapeReferral(row(), ME).interest_count, 0);
assert.equal(shapeReferral(row(), ME).my_interest, false);
assert.equal(shapeReferral(row(), ME).is_mine, false);

const withInterest = row({ referral_interests: [{ member_id: ME }, { member_id: OTHER }] });
assert.equal(shapeReferral(withInterest, ME).interest_count, 2);
assert.equal(shapeReferral(withInterest, ME).my_interest, true);

// A referral the viewer posted is theirs, whoever else is interested.
const mine = row({ author: { member_id: ME, full_name: 'Me', avatar_url: null } });
assert.equal(shapeReferral(mine, ME).is_mine, true);

// A deleted author leaves the row readable rather than crashing the feed.
assert.equal(shapeReferral(row({ author: null }), ME).is_mine, false);
assert.equal(shapeReferral(row({ referral_interests: null }), ME).interest_count, 0);

// ── Validation ──
const valid = {
  title: 'Need a caterer',
  description: 'Fifty guests, vegetarian menu.',
  location: 'Bibwewadi',
};

assert.equal(CreateReferralSchema.parse(valid).contact_method, 'phone');
assert.equal(CreateReferralSchema.parse({ ...valid, budget: ' 5000 ' }).budget, '5000');
assert.equal(CreateReferralSchema.parse(valid).budget, undefined);

// An empty budget string is not the same as omitting it, so the client must
// drop the field rather than send '' — these stay rejected/accepted as such.
assert.equal(CreateReferralSchema.parse({ ...valid, budget: '' }).budget, '');

assert.throws(() => CreateReferralSchema.parse({ ...valid, title: 'ab' }));
assert.throws(() => CreateReferralSchema.parse({ ...valid, description: 'too short' }));
assert.throws(() => CreateReferralSchema.parse({ ...valid, location: '' }));
assert.throws(() => CreateReferralSchema.parse({ ...valid, contact_method: 'pigeon' }));
