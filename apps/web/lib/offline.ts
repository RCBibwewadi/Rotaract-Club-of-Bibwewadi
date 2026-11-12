import { errorResponse } from '@rcb-2.0/shared';

export interface GuardWindow {
  fetch: typeof fetch;
  navigator: { onLine: boolean };
  location: { origin: string };
}

export function isApiRequest(url: string, origin: string): boolean {
  try {
    const parsed = new URL(url, origin);
    return parsed.origin === origin && parsed.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

/**
 * The envelope every page in this app already knows how to render, so an
 * offline failure shows a message instead of throwing a raw TypeError.
 */
export function offlineResponse(): Response {
  return Response.json(
    errorResponse('OFFLINE', 'You are offline. This action needs a connection.'),
    { status: 503 },
  );
}

const GUARDED = Symbol.for('rcb.offlineGuard');

type GuardedFetch = typeof fetch & { [GUARDED]?: { uninstall: () => void } };

/**
 * Wraps `win.fetch` so that while the browser is offline, every same-origin
 * `/api/*` request is refused locally instead of failing at the socket. The
 * app has 72 scattered `fetch('/api/...')` call sites and no shared HTTP
 * helper, so this is the one place that can hold the rule.
 *
 * Idempotent: installing over an existing guard returns that guard's uninstall.
 */
export function installOfflineGuard(win: GuardWindow, onBlocked?: () => void): () => void {
  const existing = win.fetch as GuardedFetch;
  if (existing[GUARDED]) return existing[GUARDED].uninstall;

  const realFetch = win.fetch;

  const guarded = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : (input as Request).url ?? String(input);

    // Read onLine per call: the same wrapper serves both states.
    if (!win.navigator.onLine && isApiRequest(url, win.location.origin)) {
      onBlocked?.();
      return Promise.resolve(offlineResponse());
    }

    return realFetch(input, init);
  }) as GuardedFetch;

  const uninstall = () => {
    if (win.fetch === guarded) win.fetch = realFetch;
  };
  guarded[GUARDED] = { uninstall };
  win.fetch = guarded;

  return uninstall;
}
