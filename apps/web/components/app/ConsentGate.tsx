'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import { appFetch, ApiError, useResource } from '@/lib/app/client';
import { needsConsent, type ConsentStatus } from '@/lib/app/consent';
import AppSplash from './AppSplash';

/**
 * Holds a signed-in member at the consent screen until the required DPDP
 * consent is on record for the current Privacy Notice (supabase/consents.sql).
 *
 * The optional AI-training answer is asked here too, so a member is only ever
 * interrupted once: a recorded decision — yes or no — is never asked again.
 */
export default function ConsentGate({ children }: { children: React.ReactNode }) {
  const consent = useResource<ConsentStatus | null>('/api/consent');

  if (consent.loading) return <AppSplash />;

  // shortcut: a member whose status could not be fetched (offline, API down)
  // is let through rather than locked out of an installed app they already
  // signed into. Re-check when the consent record gains a server-side
  // enforcement point beyond this screen.
  if (consent.error) return <>{children}</>;

  if (!needsConsent(consent.data)) return <>{children}</>;

  return <ConsentScreen previous={consent.data} onDone={(next) => consent.set(next)} />;
}

function ConsentScreen({
  previous,
  onDone,
}: {
  previous: ConsentStatus | null;
  onDone: (next: ConsentStatus) => void;
}) {
  // Required consent always starts unchecked. The optional answer starts from
  // the member's last recorded decision, so a Privacy Notice update does not
  // quietly reset a permission they already settled.
  const [personal, setPersonal] = useState(false);
  const [training, setTraining] = useState(previous?.ai_training_consent ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (saving) return;
    if (!personal) {
      setError('The first consent is needed to use the app.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const next = await appFetch<ConsentStatus>('/api/consent', {
        method: 'POST',
        body: JSON.stringify({ personal_data_consent: true, ai_training_consent: training }),
      });
      onDone(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your choice. Try again.');
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-[100svh] flex-col bg-app-canvas">
      <div
        className="flex-1 overflow-y-auto px-5 pb-6"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 2rem)' }}
      >
        <h1 className="text-[26px] font-bold tracking-tight text-app-plum">Your privacy</h1>
        <p className="mt-1.5 text-sm text-app-plum/55">
          Before you continue, please tell us what we may do with your information.
        </p>

        <div className="mt-6 space-y-3">
          <ConsentCheckbox
            id="consent-personal"
            checked={personal}
            onChange={setPersonal}
            badge="Required"
            label="I consent to the collection and processing of my personal information, including my email address and contact number, and the storage and processing of my submitted ideas and AI conversations to provide the application's services, as described in the Privacy Notice."
          />
          <ConsentCheckbox
            id="consent-training"
            checked={training}
            onChange={setTraining}
            badge="Optional"
            label="I voluntarily agree that my submitted ideas, prompts and AI conversations may be used to train and improve our own AI models in the future. I understand that this permission is optional and separate from the storage of my data for providing the application's services."
          />
        </div>

        <p className="mt-4 text-xs leading-relaxed text-app-plum/45">
          Saying no to the optional permission changes nothing about how you use the app. You can
          change it any time under Privacy in your profile.
        </p>
      </div>

      <div
        className="shrink-0 border-t border-black/5 bg-app-panel px-5 pt-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
      >
        {error && (
          <p role="alert" className="mb-3 flex items-start gap-2 text-sm text-accent">
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <ConsentNotice />

        <button
          type="button"
          onClick={() => void submit()}
          disabled={saving}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-base font-semibold text-white transition-colors hover:bg-accent-light disabled:opacity-60"
        >
          {saving && <Loader2 size={18} className="animate-spin" aria-hidden />}
          {saving ? 'Saving' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

function ConsentCheckbox({
  id,
  checked,
  onChange,
  label,
  badge,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  badge: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex gap-3 rounded-2xl bg-white p-4 text-[13px] leading-relaxed text-app-plum/75"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-accent"
      />
      <span>
        <span className="mb-1 block text-xs font-semibold tracking-wide text-app-plum/45 uppercase">
          {badge}
        </span>
        {label}
      </span>
    </label>
  );
}

/**
 * The same line sits above the app's Log in button. Both pages open the legal
 * pages in the browser: they live on the website, outside the app shell.
 */
export function ConsentNotice({ className = '' }: { className?: string }) {
  return (
    <p className={`text-center text-xs leading-relaxed text-app-plum/50 ${className}`}>
      By continuing, you agree to our{' '}
      <Link
        href="/terms-and-conditions"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        Terms &amp; Conditions
      </Link>{' '}
      and acknowledge our{' '}
      <Link
        href="/privacy-policy"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        Privacy Notice
      </Link>
      .
    </p>
  );
}
