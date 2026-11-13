/**
 * Self-check for the consent gate's rule. The repo has no test runner, so this
 * runs on Node directly:
 *
 *   node --experimental-strip-types apps/web/lib/app/consent.check.ts
 *
 * It prints nothing and exits 0 when everything holds.
 */
import assert from 'node:assert/strict';
import { CONSENT_VERSION, needsConsent, type ConsentStatus } from './consent.ts';

const record = (over: Partial<ConsentStatus> = {}): ConsentStatus => ({
  personal_data_consent: true,
  ai_training_consent: false,
  consent_version: CONSENT_VERSION,
  accepted_at: '2026-11-13T00:00:00.000Z',
  ...over,
});

// A member who has never answered is asked.
assert.equal(needsConsent(null), true);

// A current, accepted record is never asked again — whatever they said about
// training.
assert.equal(needsConsent(record()), false);
assert.equal(needsConsent(record({ ai_training_consent: true })), false);

// A withdrawal of the required consent puts the member back at the gate.
assert.equal(needsConsent(record({ personal_data_consent: false })), true);

// An older version means the purposes changed: ask again.
assert.equal(needsConsent(record({ consent_version: '2020-01-01' })), true);
