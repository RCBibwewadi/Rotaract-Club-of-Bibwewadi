// Run: npx tsx apps/web/lib/pwa.test.ts
import assert from 'node:assert/strict';
import {
  isIOS,
  isIOSSafari,
  isStandalone,
  createInstallCapture,
  type InstallPromptEvent,
} from './pwa';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/118.0 Mobile/15E148 Safari/604.1';
const IPHONE_FIREFOX =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/118.0 Mobile/15E148 Safari/604.1';
const IPAD_SAFARI =
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0 Mobile Safari/537.36';

interface FakeEvent extends InstallPromptEvent {
  defaultPrevented: boolean;
}

function fakeInstallPromptEvent(): FakeEvent {
  return {
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    prompt: async () => {},
    userChoice: Promise.resolve({ outcome: 'accepted' as const }),
  };
}

function fakeWindow() {
  const listeners = new Map<string, ((e: InstallPromptEvent) => void)[]>();
  return {
    addEventListener(type: string, cb: (e: InstallPromptEvent) => void) {
      listeners.set(type, [...(listeners.get(type) ?? []), cb]);
    },
    dispatch(type: string, event: InstallPromptEvent) {
      (listeners.get(type) ?? []).forEach((cb) => cb(event));
    },
  };
}

function main() {
  assert.equal(isIOS(IPHONE_SAFARI), true);
  assert.equal(isIOS(IPHONE_CHROME), true);
  assert.equal(isIOS(ANDROID), false);

  // Review Focus 4: only Safari on iOS can add to the home screen
  assert.equal(isIOSSafari(IPHONE_SAFARI), true);
  assert.equal(isIOSSafari(IPAD_SAFARI), true);
  assert.equal(isIOSSafari(IPHONE_CHROME), false, 'CriOS cannot add to home screen');
  assert.equal(isIOSSafari(IPHONE_FIREFOX), false, 'FxiOS cannot add to home screen');
  assert.equal(isIOSSafari(ANDROID), false);

  assert.equal(isStandalone({ matchMedia: () => ({ matches: true }) }), true);
  assert.equal(isStandalone({ matchMedia: () => ({ matches: false }) }), false);
  assert.equal(isStandalone({ navigator: { standalone: true } }), true, 'iOS legacy flag');
  assert.equal(isStandalone({}), false, 'no browser APIs present');

  // Review Focus 3: an event fired before anyone subscribed is still delivered
  {
    const win = fakeWindow();
    const capture = createInstallCapture(win); // listening from here on
    const event = fakeInstallPromptEvent();
    win.dispatch('beforeinstallprompt', event); // fires before React mounts

    assert.equal(event.defaultPrevented, true, 'mini-infobar suppressed');
    assert.equal(capture.get(), event, 'event stashed for a late subscriber');

    let seen: InstallPromptEvent | null | undefined = undefined;
    capture.subscribe((e) => (seen = e)); // subscriber arrives after the event
    assert.equal(seen, event, 'late subscriber is replayed the stashed event');

    capture.clear();
    assert.equal(capture.get(), null);
    assert.equal(seen, null, 'subscriber notified on clear');
  }

  // unsubscribing stops delivery
  {
    const win = fakeWindow();
    const capture = createInstallCapture(win);
    let calls = 0;
    const unsubscribe = capture.subscribe(() => calls++);
    assert.equal(calls, 1, 'subscriber is called immediately with the current value');

    win.dispatch('beforeinstallprompt', fakeInstallPromptEvent());
    assert.equal(calls, 2);

    unsubscribe();
    capture.clear();
    assert.equal(calls, 2, 'no delivery after unsubscribe');
  }

  console.log('pwa helpers: ok');
}

main();
