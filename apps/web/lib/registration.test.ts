// Run: npx tsx lib/registration.test.ts
import assert from 'node:assert/strict';
import { validateAnswer, safeNextPath, type RegistrationQuestion } from './registration';

const q = (type: RegistrationQuestion['type'], extra: Partial<RegistrationQuestion> = {}): RegistrationQuestion =>
  ({ id: 'q', label: 'Q', type, required: true, ...extra });

assert.match(validateAnswer(q('text'), '')!, /required/);
assert.equal(validateAnswer(q('text', { required: false }), ''), null);
assert.equal(validateAnswer(q('email'), 'a@b.co'), null);
assert.ok(validateAnswer(q('email'), 'nope'));
assert.equal(validateAnswer(q('phone'), '+91 98765 43210'), null);
assert.ok(validateAnswer(q('phone'), '12ab'));
assert.equal(validateAnswer(q('number'), '42.5'), null);
assert.ok(validateAnswer(q('number'), 'x'));
assert.equal(validateAnswer(q('dropdown', { options: ['A', 'B'] }), 'A'), null);
assert.ok(validateAnswer(q('dropdown', { options: ['A', 'B'] }), 'C'));
assert.equal(validateAnswer(q('checkbox', { options: ['A', 'B'] }), ['A', 'B']), null);
assert.ok(validateAnswer(q('checkbox', { options: ['A'] }), ['Z']));
assert.ok(validateAnswer(q('checkbox', { options: ['A'] }), []));
assert.ok(validateAnswer(q('text'), ['array-for-text']));
assert.ok(validateAnswer(q('textarea'), 'x'.repeat(5001)));

assert.equal(safeNextPath('/register'), '/register');
assert.equal(safeNextPath('//evil.com'), null);
assert.equal(safeNextPath('https://evil.com'), null);
assert.equal(safeNextPath(null), null);

console.log('registration validation: ok');
