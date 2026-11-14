/**
 * Self-check for the app's pure helpers. The repo has no test runner, so this
 * runs on Node directly:
 *
 *   node --experimental-strip-types apps/web/lib/app/format.check.ts
 *
 * It prints nothing and exits 0 when everything holds.
 */
import assert from 'node:assert/strict';
import { timeAgo, waNumber, initials } from './format.ts';
import { shouldReload } from './update.ts';

const now = Date.parse('2026-11-12T12:00:00Z');
const ago = (ms: number) => new Date(now - ms).toISOString();

assert.equal(timeAgo(ago(5_000), now), 'just now');
assert.equal(timeAgo(ago(59_000), now), 'just now');
assert.equal(timeAgo(ago(60_000), now), '1m ago');
assert.equal(timeAgo(ago(59 * 60_000), now), '59m ago');
assert.equal(timeAgo(ago(3_600_000), now), '1h ago');
assert.equal(timeAgo(ago(23 * 3_600_000), now), '23h ago');
assert.equal(timeAgo(ago(86_400_000), now), '1d ago');
assert.equal(timeAgo(ago(6 * 86_400_000), now), '6d ago');
// A week or older falls back to an absolute date rather than "7d ago".
assert.match(timeAgo(ago(7 * 86_400_000), now), /\d/);
assert.ok(!timeAgo(ago(7 * 86_400_000), now).includes('ago'));
// A clock skew that puts a post in the future must not print a negative age.
assert.equal(timeAgo(new Date(now + 10_000).toISOString(), now), 'just now');

assert.equal(waNumber('9876543210'), '919876543210');
assert.equal(waNumber('+91 98765 43210'), '919876543210');
assert.equal(waNumber('098765-43210'), '09876543210');

assert.equal(initials('Priya Sharma'), 'PS');
assert.equal(initials('priya'), 'P');
assert.equal(initials('  Asha  Rani  Patil '), 'AR');
assert.equal(initials(''), '?');

// ── Update detection ──────────────────────────────────────────
// A newer deployment is live and this session has not reloaded for it yet.
assert.equal(shouldReload('build-AAA', 'build-BBB', null), true);
// Already current.
assert.equal(shouldReload('build-AAA', 'build-AAA', null), false);
// Already reloaded once for that build: stop rather than loop.
assert.equal(shouldReload('build-AAA', 'build-BBB', 'build-BBB'), false);
// Reloaded for an older build, and a newer one has since shipped.
assert.equal(shouldReload('build-AAA', 'build-CCC', 'build-BBB'), true);
// Local builds never reload.
assert.equal(shouldReload('dev', 'build-BBB', null), false);
assert.equal(shouldReload(undefined, 'build-BBB', null), false);
// A malformed or empty answer from /api/version is ignored.
assert.equal(shouldReload('build-AAA', '', null), false);
assert.equal(shouldReload('build-AAA', null, null), false);
assert.equal(shouldReload('build-AAA', 42, null), false);
assert.equal(shouldReload('build-AAA', undefined, null), false);
