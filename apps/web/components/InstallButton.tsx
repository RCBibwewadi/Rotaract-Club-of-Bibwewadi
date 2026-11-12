'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Download, Share, Plus, X } from 'lucide-react';
import {
  createInstallCapture,
  isIOSSafari,
  isStandalone,
  type InstallCapture,
  type InstallPromptEvent,
} from '@/lib/pwa';

// Module scope on purpose: Chrome fires beforeinstallprompt before React
// mounts, so a listener registered in an effect would miss it entirely.
const capture: InstallCapture | null =
  typeof window === 'undefined' ? null : createInstallCapture(window);

// useSyncExternalStore rather than an effect: these are browser facts that do
// not exist during SSR, and reading them this way keeps hydration honest
// without setting state from an effect.
const noopSubscribe = () => () => {};
const subscribeToPrompt = (cb: () => void) => capture?.subscribe(cb) ?? noopSubscribe();

interface Props {
  isDark: boolean;
  menuOpen: boolean;
}

export default function InstallButton({ isDark, menuOpen }: Props) {
  const [iosHelp, setIosHelp] = useState(false);

  const prompt = useSyncExternalStore<InstallPromptEvent | null>(
    subscribeToPrompt,
    () => capture?.get() ?? null,
    () => null,
  );
  const standalone = useSyncExternalStore(
    noopSubscribe,
    () => isStandalone(window),
    () => true, // server render: assume installed, so nothing flashes
  );
  const iosFallback = useSyncExternalStore(
    noopSubscribe,
    () => isIOSSafari(navigator.userAgent),
    () => false,
  );

  useEffect(() => {
    if (!capture) return;
    const onInstalled = () => capture.clear();
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  const install = useCallback(async () => {
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      capture?.clear();
      return;
    }
    setIosHelp(true);
  }, [prompt]);

  // Rendered only where install is actually possible: a captured Chromium
  // prompt, or Safari on iOS where the user adds it by hand.
  if (standalone || (!prompt && !iosFallback)) return null;

  return (
    <>
      <button
        onClick={install}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-medium transition-all ${menuOpen ? 'border-white/25 text-white/80 hover:border-accent hover:text-white' : isDark ? 'border-white/20 text-white/80 hover:border-accent hover:text-white' : 'border-dark/15 text-dark/80 hover:border-accent hover:text-dark'}`}
        title="Install App"
      >
        <Download size={16} />
        Install App
      </button>

      {iosHelp && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-dark/60 backdrop-blur-sm px-4 pb-6 sm:pb-0"
          role="dialog"
          aria-modal="true"
          aria-label="Install instructions"
          onClick={() => setIosHelp(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-accent/25 bg-light-card dark:bg-dark-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold">Add RCB to your Home Screen</h2>
              <button
                onClick={() => setIosHelp(false)}
                aria-label="Close"
                className="opacity-50 hover:opacity-100 transition-opacity"
              >
                <X size={18} />
              </button>
            </div>
            <ol className="mt-5 space-y-4 text-sm opacity-80">
              <li className="flex items-center gap-3">
                <Share size={18} className="text-accent shrink-0" />
                Tap the Share button in Safari&apos;s toolbar.
              </li>
              <li className="flex items-center gap-3">
                <Plus size={18} className="text-accent shrink-0" />
                Choose &ldquo;Add to Home Screen&rdquo;.
              </li>
              <li className="flex items-center gap-3">
                <Download size={18} className="text-accent shrink-0" />
                Tap Add — RCB opens like an app from then on.
              </li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
