// Run: npx tsx apps/web/lib/offline.test.ts
import assert from 'node:assert/strict';
import { isApiRequest, offlineResponse, installOfflineGuard } from './offline';

interface FakeWindowOptions {
  online?: boolean;
  /** Requests never settle until resolveAll() is called. */
  hang?: boolean;
  failWith?: Error;
}

function fakeWindow(options: FakeWindowOptions = {}) {
  const { online = true, hang = false, failWith } = options;
  const realFetchCalls: string[] = [];
  const pending: ((value: Response) => void)[] = [];

  const realFetch = ((input: RequestInfo | URL) => {
    realFetchCalls.push(typeof input === 'string' ? input : String(input));
    if (failWith) return Promise.reject(failWith);
    if (hang) return new Promise<Response>((resolve) => pending.push(resolve));
    return Promise.resolve(Response.json({ success: true }));
  }) as typeof fetch;

  const win = {
    fetch: realFetch,
    realFetch,
    realFetchCalls,
    navigator: { onLine: online },
    location: { origin: 'https://rcb.test' },
    resolveAll(body: unknown) {
      pending.splice(0).forEach((resolve) => resolve(Response.json(body)));
    },
  };
  return win;
}

async function main() {
  assert.equal(isApiRequest('https://rcb.test/api/members/me', 'https://rcb.test'), true);
  assert.equal(isApiRequest('https://rcb.test/profile', 'https://rcb.test'), false);
  assert.equal(
    isApiRequest('https://other.test/api/x', 'https://rcb.test'),
    false,
    'cross-origin is not ours to block',
  );

  // Review Focus 5: the envelope the login page already knows how to render.
  // packages/shared/src/errors.ts returns a FLAT shape, not a nested `error`.
  {
    const res = offlineResponse();
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'OFFLINE');
    assert.ok(body.message.length > 0);
  }

  // offline: every same-origin /api/ call is refused without touching the network
  {
    const win = fakeWindow({ online: false });
    installOfflineGuard(win);
    const res = await win.fetch('https://rcb.test/api/auth/login', {
      method: 'POST',
      body: '{}',
    });
    assert.equal(res.status, 503);
    assert.equal(win.realFetchCalls.length, 0, 'never reached the network');
  }
  {
    const win = fakeWindow({ online: false });
    installOfflineGuard(win);
    const res = await win.fetch('https://rcb.test/api/members/me');
    assert.equal(res.status, 503, 'GETs fail fast with the envelope, not a raw TypeError');
  }

  // relative URLs are resolved against the origin, which is how the app calls its API
  {
    const win = fakeWindow({ online: false });
    installOfflineGuard(win);
    const res = await win.fetch('/api/members/me');
    assert.equal(res.status, 503, "fetch('/api/...') is blocked too");
  }

  // a refused request reports itself, so the reconnect handler knows a reload is owed
  {
    const win = fakeWindow({ online: false });
    let blocked = 0;
    installOfflineGuard(win, () => blocked++);
    await win.fetch('https://rcb.test/api/members/me');
    await win.fetch('https://rcb.test/_next/static/chunks/a.js');
    assert.equal(blocked, 1, 'only the refused /api/ call counts');
  }

  // offline: non-API and cross-origin requests are left alone
  {
    const win = fakeWindow({ online: false });
    installOfflineGuard(win);
    await win.fetch('https://rcb.test/_next/static/chunks/a.js');
    await win.fetch('https://fonts.googleapis.com/css2?family=DM+Sans');
    assert.equal(win.realFetchCalls.length, 2);
  }

  // online: the guard is transparent
  {
    const win = fakeWindow({ online: true });
    installOfflineGuard(win);
    await win.fetch('https://rcb.test/api/members/me');
    assert.equal(win.realFetchCalls.length, 1);
  }

  // the guard reads onLine per call, not once at install time
  {
    const win = fakeWindow({ online: true });
    installOfflineGuard(win);
    await win.fetch('https://rcb.test/api/members/me');
    win.navigator.onLine = false;
    const res = await win.fetch('https://rcb.test/api/members/me');
    assert.equal(res.status, 503);
    assert.equal(win.realFetchCalls.length, 1, 'the second call never reached the network');
  }

  // Review Focus 1: installing twice must not wrap twice
  {
    const win = fakeWindow({ online: true });
    installOfflineGuard(win);
    installOfflineGuard(win);
    const guarded = win.fetch;
    const uninstall = installOfflineGuard(win);
    assert.equal(win.fetch, guarded, 'second install is a no-op');
    uninstall();
    assert.equal(win.fetch, win.realFetch, 'uninstall restores the original fetch');
  }

  console.log('offline guard: ok');
}

main();
