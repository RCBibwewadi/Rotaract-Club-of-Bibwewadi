/**
 * Decides whether the running app has fallen behind the live deployment.
 * Pure and free of React so lib/app/format.check.ts can exercise it.
 *
 * @param running      build id stamped on <html data-dpl-id> at build time
 * @param serverBuild  whatever /api/version returned
 * @param lastReloaded build id this session already reloaded for, if any
 */
export function shouldReload(
  running: string | undefined,
  serverBuild: unknown,
  lastReloaded: string | null,
): boolean {
  // A local build has no deployment to fall behind.
  if (!running || running === 'dev') return false;
  if (typeof serverBuild !== 'string' || !serverBuild) return false;
  if (serverBuild === running) return false;
  // Reloading twice for the same build means the two ids can never agree;
  // stop rather than loop.
  if (lastReloaded === serverBuild) return false;
  return true;
}

// Remembers the build already reloaded for, so a build id that can never match
// (a misconfigured deployment) cannot put the app in a reload loop.
const RELOADED_KEY = 'rcb-app-reloaded-for';

/** The build already reloaded for, or undefined when storage is unreadable. */
function lastReloadedBuild(): string | null | undefined {
  try {
    return sessionStorage.getItem(RELOADED_KEY);
  } catch {
    return undefined;
  }
}

let checking = false;

/**
 * Asks the server which build is live and reloads once if this app is behind.
 * Called when the app opens, when it returns to the foreground, and when the
 * member pulls a screen down to refresh.
 */
export async function checkForAppUpdate(): Promise<void> {
  if (checking || typeof document === 'undefined') return;
  if (document.visibilityState !== 'visible') return;

  const running = document.documentElement.dataset.dplId;
  if (!running || running === 'dev') return;

  checking = true;
  try {
    const res = await fetch('/api/version', { cache: 'no-store' });
    if (!res.ok) return;

    const { build } = await res.json();
    const last = lastReloadedBuild();
    // Without storage there is no way to stop a loop, so never reload.
    if (last === undefined) return;
    if (!shouldReload(running, build, last)) return;

    try {
      sessionStorage.setItem(RELOADED_KEY, build);
    } catch {
      // A failed write only means the next check tries again.
    }
    window.location.reload();
  } catch {
    // Offline or blocked — try again the next time the app is opened.
  } finally {
    checking = false;
  }
}
