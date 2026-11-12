'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { appFetch, ApiError } from '@/lib/app/client';
import { CONTACT_METHODS } from '@/app/api/lib/referrals';
import type { Referral } from '@/lib/app/types';

const fieldClass =
  'w-full rounded-2xl border border-app-plum/10 bg-white px-4 py-3.5 text-[15px] text-app-plum ' +
  'placeholder-app-plum/30 outline-none transition-colors focus:border-app-pink';

const CONTACT_LABELS: Record<(typeof CONTACT_METHODS)[number], string> = {
  phone: 'Phone',
  whatsapp: 'WhatsApp',
  email: 'Email',
};

export default function NewReferralPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [contactMethod, setContactMethod] =
    useState<(typeof CONTACT_METHODS)[number]>('phone');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (title.trim().length < 3) {
      setError('Give your referral a title of at least 3 characters');
      return;
    }
    if (description.trim().length < 10) {
      setError('Describe what you need in a little more detail');
      return;
    }
    if (!location.trim()) {
      setError('Add a location');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const referral = await appFetch<Referral>('/api/referrals', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          // The field is optional; an empty string would fail validation.
          ...(budget.trim() ? { budget: budget.trim() } : {}),
          contact_method: contactMethod,
        }),
      });
      router.replace(`/app/referrals/${referral.referral_id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not post your referral');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-[100svh] flex-col overflow-hidden bg-app-canvas">
      <header
        className="shrink-0 flex items-center gap-3 border-b border-black/5 bg-app-canvas/90 px-4 pb-3 backdrop-blur-lg"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="-ml-1 rounded-full p-1.5 text-app-plum"
        >
          <ArrowLeft size={22} aria-hidden />
        </button>
        <span className="text-base font-semibold text-app-plum">New referral</span>
      </header>

      <form
        onSubmit={submit}
        className="flex-1 overflow-y-auto overscroll-contain px-4 pt-5"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
        noValidate
      >
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-app-plum/70">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Looking for a wedding photographer"
          className={fieldClass}
        />

        <label
          htmlFor="description"
          className="mt-5 mb-1.5 block text-sm font-medium text-app-plum/70"
        >
          What do you need?
        </label>
        <textarea
          id="description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={5000}
          placeholder="Who or what you are looking for, and anything that helps a member connect you."
          className={`${fieldClass} resize-none`}
        />

        <label htmlFor="location" className="mt-5 mb-1.5 block text-sm font-medium text-app-plum/70">
          Location
        </label>
        <input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={200}
          placeholder="Bibwewadi, Pune"
          className={fieldClass}
        />

        <label htmlFor="budget" className="mt-5 mb-1.5 block text-sm font-medium text-app-plum/70">
          Budget <span className="font-normal text-app-plum/35">(optional)</span>
        </label>
        <input
          id="budget"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          maxLength={100}
          placeholder="₹10,000 – ₹15,000"
          className={fieldClass}
        />

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium text-app-plum/70">
            How should members reach you?
          </legend>
          <div className="flex flex-wrap gap-2">
            {CONTACT_METHODS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setContactMethod(option)}
                aria-pressed={contactMethod === option}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  contactMethod === option
                    ? 'bg-accent text-white'
                    : 'border border-app-plum/10 bg-white text-app-plum/60'
                }`}
              >
                {CONTACT_LABELS[option]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-app-plum/40">
            Members who express interest see that detail from your profile.
          </p>
        </fieldset>

        {error && (
          <p role="alert" className="mt-5 text-sm text-accent">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-base font-semibold text-white transition-colors hover:bg-accent-light disabled:opacity-60"
        >
          {submitting && <Loader2 size={18} className="animate-spin" aria-hidden />}
          {submitting ? 'Posting' : 'Post referral'}
        </button>
      </form>
    </div>
  );
}
