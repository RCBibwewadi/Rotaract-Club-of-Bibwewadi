/**
 * Self-check for the notification badge helpers. The repo has no test runner,
 * so this runs on Node directly:
 *
 *   node --experimental-strip-types apps/web/lib/app/badges.check.ts
 *
 * It prints nothing and exits 0 when everything holds.
 */
import assert from 'node:assert/strict';
import { tabFor, decodeKey, NOTIFIED_TABS } from './badges.ts';

// ── Which tab a path belongs to ───────────────────────────────
assert.equal(tabFor('/app/ideas'), 'ideas');
assert.equal(tabFor('/app/schedule'), 'schedule');
assert.equal(tabFor('/app/announcements'), 'announcements');
assert.equal(tabFor('/app/referrals'), 'referrals');
// A detail screen still belongs to its tab, so opening one clears the badge.
assert.equal(tabFor('/app/ideas/abc-123'), 'ideas');
assert.equal(tabFor('/app/referrals/abc-123'), 'referrals');
// Tabs without new content, and everything outside the app.
assert.equal(tabFor('/app/profile'), null);
assert.equal(tabFor('/app/members'), null);
assert.equal(tabFor('/app/admin/announcements'), null);
assert.equal(tabFor('/app'), null);
assert.equal(tabFor('/'), null);
// A prefix that merely starts the same is a different route, not this tab.
assert.equal(tabFor('/app/ideaspace'), null);

assert.equal(NOTIFIED_TABS.length, 4);

// ── VAPID key decoding ────────────────────────────────────────
// base64url of the bytes 0..5, which plain base64 would write as "AAECAwQF".
assert.deepEqual(Array.from(decodeKey('AAECAwQF')), [0, 1, 2, 3, 4, 5]);
// '-' and '_' stand in for '+' and '/': 0xFB 0xFF 0xFE decodes from "+//+".
assert.deepEqual(Array.from(decodeKey('-__-')), [251, 255, 254]);
// Unpadded input — which is how a VAPID public key ships — must still decode.
assert.deepEqual(Array.from(decodeKey('AAEC')), [0, 1, 2]);
assert.deepEqual(Array.from(decodeKey('AAECAw')), [0, 1, 2, 3]);
// A real 65-byte uncompressed P-256 point, which is what PushManager expects.
const key = 'BD9CkTt4fl5PtsiU1ljsIuvkzOjVWHQ1R5DUfdjSt6Js_zTPOe350fhLNNKWpojmpyE0uE4Ja5iPeUDO889h2uw';
assert.equal(decodeKey(key).length, 65);
assert.equal(decodeKey(key)[0], 0x04);
