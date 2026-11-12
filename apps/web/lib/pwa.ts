/** The Chromium-only event that lets a site show its own install button. */
export interface InstallPromptEvent {
  preventDefault(): void;
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function isIOS(userAgent: string): boolean {
  return /iPad|iPhone|iPod/.test(userAgent);
}

/**
 * Only Safari on iOS can add a site to the home screen — Chrome (CriOS) and
 * Firefox (FxiOS) cannot, so they must not be shown the Share-sheet steps.
 * iPadOS 13+ reports a desktop Mac user agent; we deliberately do not try to
 * detect it, since a missing button is the safe failure and wrong instructions
 * are not.
 */
export function isIOSSafari(userAgent: string): boolean {
  return isIOS(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
}

interface StandaloneWindow {
  matchMedia?: (query: string) => { matches: boolean };
  // `unknown` so the real `Window` is assignable: `standalone` is a
  // non-standard iOS property that TypeScript's `Navigator` does not declare.
  navigator?: unknown;
}

export function isStandalone(win: StandaloneWindow): boolean {
  if (win.matchMedia?.('(display-mode: standalone)').matches) return true;
  const nav = win.navigator as { standalone?: boolean } | undefined;
  return nav?.standalone === true; // iOS predates display-mode
}

interface CaptureWindow {
  addEventListener(type: string, cb: (e: InstallPromptEvent) => void): void;
}

export interface InstallCapture {
  get(): InstallPromptEvent | null;
  clear(): void;
  subscribe(cb: (e: InstallPromptEvent | null) => void): () => void;
}

/**
 * Chrome fires `beforeinstallprompt` very early — often before React has
 * mounted — so this starts listening the moment it is called (at module scope)
 * and replays whatever it caught to a subscriber that arrives later.
 */
export function createInstallCapture(win: CaptureWindow): InstallCapture {
  let stashed: InstallPromptEvent | null = null;
  const subscribers = new Set<(e: InstallPromptEvent | null) => void>();

  const publish = () => subscribers.forEach((cb) => cb(stashed));

  win.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // suppress Chrome's own mini-infobar
    stashed = event;
    publish();
  });

  return {
    get: () => stashed,
    clear() {
      stashed = null;
      publish();
    },
    subscribe(cb) {
      subscribers.add(cb);
      cb(stashed);
      return () => subscribers.delete(cb);
    },
  };
}
