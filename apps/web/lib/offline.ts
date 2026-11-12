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
  const inFlight = new Map<string, Promise<Response>>();

  const guarded = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : (input as Request).url ?? String(input);
    const isApi = isApiRequest(url, win.location.origin);

    // Read onLine per call: the same wrapper serves both states.
    if (!win.navigator.onLine && isApi) {
      onBlocked?.();
      return Promise.resolve(offlineResponse());
    }

    // Collapse a double-submitted mutation — a double-tapped button, a form
    // posted twice — into one request, so the server never sees duplicates.
    // shortcut: only string bodies are keyed; reading a FormData or stream
    // body to key it would consume it, so those pass straight through.
    // Upgrade when an upload form starts double-submitting in practice.
    const method = (init?.method ?? 'GET').toUpperCase();
    const body = init?.body;
    const keyable = isApi && method !== 'GET' && (typeof body === 'string' || body == null);
    if (!keyable) return realFetch(input, init);

    const key = `${method} ${url} ${body ?? ''}`;
    const pending = inFlight.get(key);
    if (pending) return pending.then((response) => response.clone());

    const request = realFetch(input, init).finally(() => inFlight.delete(key));
    inFlight.set(key, request);
    // Each caller reads its own copy: a Response body can only be read once.
    return request.then((response) => response.clone());
  }) as GuardedFetch;

  const uninstall = () => {
    if (win.fetch === guarded) win.fetch = realFetch;
  };
  guarded[GUARDED] = { uninstall };
  win.fetch = guarded;

  return uninstall;
}
