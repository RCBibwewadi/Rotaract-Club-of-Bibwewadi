'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, IndianRupee, Loader2, Upload } from 'lucide-react';
import { appFetch, useResource, ApiError } from '@/lib/app/client';
import { useAuthStore } from '@/lib/auth-store';
import { Loading, ErrorState, EmptyState } from '@/components/app/Screen';
import {
  validateAnswer,
  photoError,
  photoField,
  EMAIL_RE,
  PROOF_EXTS,
  PROOF_MAX_SIZE,
  PHOTO_EXTS,
  type AnswerValue,
  type PublicRegistrationForm,
  type RegistrationQuestion,
} from '@/lib/registration';

const fieldClass =
  'w-full rounded-2xl border border-app-plum/10 bg-white px-4 py-3.5 text-[15px] text-app-plum ' +
  'placeholder-app-plum/30 outline-none transition-colors focus:border-app-pink';
const labelClass = 'mt-5 mb-1.5 block text-sm font-medium text-app-plum/70';

/**
 * The live registration form, filled in from the app. It posts to the same
 * /api/registrations route as the website's /register page, so the answers,
 * payment proof and one-per-person rule are identical.
 */
export default function AppRegisterPage() {
  const router = useRouter();
  const form = useResource<PublicRegistrationForm | null>('/api/registrations/active');

  return (
    <div className="flex h-[100svh] flex-col overflow-hidden bg-app-canvas">
      <header
        className="flex shrink-0 items-center gap-3 border-b border-black/5 bg-app-canvas/90 px-4 pb-3 backdrop-blur-lg"
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
        <span className="truncate text-base font-semibold text-app-plum">
          {form.data?.title ?? 'Register'}
        </span>
      </header>

      <div
        className="flex-1 overflow-y-auto overscroll-contain px-4 pt-5"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
      >
        {form.loading && <Loading label="Loading form" />}
        {form.error && <ErrorState message={form.error} onRetry={form.reload} />}
        {!form.loading && !form.error && !form.data && (
          <EmptyState title="Registrations are closed" body="Check the Calendar for what is next." />
        )}
        {form.data && <RegisterForm form={form.data} />}
      </div>
    </div>
  );
}

function RegisterForm({ form }: { form: PublicRegistrationForm }) {
  const router = useRouter();
  const member = useAuthStore((s) => s.member);
  // Members get their own email prefilled until they edit it.
  const [emailEdit, setEmailEdit] = useState<string | null>(null);
  const email = emailEdit ?? member?.email ?? '';
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [proof, setProof] = useState<File | null>(null);
  const [photos, setPhotos] = useState<Record<string, File | null>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(!!form.my_registration);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const problem =
      (EMAIL_RE.test(email.trim()) ? null : 'Enter a valid email') ??
      form.questions.map((q) => validateAnswer(q, answers[q.id])).find(Boolean) ??
      form.questions
        .map((q) => (q.type === 'photo' && photos[q.id] ? photoError(q, photos[q.id]!) : null))
        .find(Boolean) ??
      (form.payment_enabled && !proof ? 'Upload your payment screenshot' : null);
    if (problem) {
      setError(problem);
      return;
    }

    const body = new FormData();
    body.append('form_id', form.form_id);
    body.append('email', email.trim());
    body.append('answers', JSON.stringify(answers));
    if (form.payment_enabled && proof) body.append('payment_proof', proof);
    for (const q of form.questions) {
      const photo = q.type === 'photo' && photos[q.id];
      if (photo) body.append(photoField(q.id), photo);
    }

    setSubmitting(true);
    setError('');
    try {
      await appFetch('/api/registrations', { method: 'POST', body });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setError('');
    if (file) {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      const problem = !PROOF_EXTS.includes(ext)
        ? 'Payment proof must be JPG, PNG, WEBP or PDF'
        : file.size > PROOF_MAX_SIZE
          ? 'Payment proof must be under 5MB'
          : null;
      if (problem) {
        setError(problem);
        e.target.value = '';
        return;
      }
    }
    setProof(file);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center">
        <CheckCircle2 size={36} className="text-emerald-600" aria-hidden />
        <p className="text-lg font-semibold text-app-plum">You are registered</p>
        <p className="text-sm text-app-plum/55">
          {form.payment_enabled
            ? 'We will confirm once your payment is verified.'
            : 'See you there.'}
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-2 rounded-full bg-app-plum px-5 py-2 text-sm font-semibold text-white"
        >
          Back to the Calendar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      {form.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={form.image_url} alt="" className="mb-4 h-40 w-full rounded-2xl object-cover" />
      )}
      {form.description && (
        <p className="text-sm leading-relaxed whitespace-pre-line text-app-plum/65">
          {form.description}
        </p>
      )}

      <label htmlFor="reg-email" className={labelClass}>
        Email <span className="text-accent">*</span>
      </label>
      <input
        id="reg-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmailEdit(e.target.value)}
        className={fieldClass}
      />

      {form.questions.map((q) => (
        <div key={q.id}>
          <label id={`q-${q.id}-label`} htmlFor={`q-${q.id}`} className={labelClass}>
            {q.label} {q.required && <span className="text-accent">*</span>}
          </label>
          <QuestionInput
            q={q}
            value={answers[q.id]}
            onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
            onPhoto={(f) => setPhotos((prev) => ({ ...prev, [q.id]: f }))}
          />
        </div>
      ))}

      {form.payment_enabled && (
        <div className="mt-6 rounded-2xl bg-white p-4">
          <p className="flex items-center gap-1 text-lg font-bold text-app-plum">
            <IndianRupee size={18} aria-hidden />
            {form.payment_amount}
            {form.payment_original_amount && (
              <span className="ml-2 text-sm font-normal text-app-plum/40 line-through">
                ₹{form.payment_original_amount}
              </span>
            )}
          </p>
          {form.payment_qr_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.payment_qr_url}
              alt="Payment QR code"
              className="mx-auto mt-3 w-52 rounded-xl"
            />
          )}
          <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-app-plum/20 py-3.5 text-sm font-medium text-app-plum/60">
            <Upload size={16} aria-hidden />
            <span className="truncate">{proof ? proof.name : 'Upload payment screenshot'}</span>
            <input
              type="file"
              accept={PROOF_EXTS.join(',')}
              className="hidden"
              onChange={onProof}
            />
          </label>
        </div>
      )}

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
        {submitting ? 'Submitting' : 'Register'}
      </button>
    </form>
  );
}

function QuestionInput({
  q,
  value,
  onChange,
  onPhoto,
}: {
  q: RegistrationQuestion;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
  onPhoto: (file: File | null) => void;
}) {
  const str = typeof value === 'string' ? value : '';
  const id = `q-${q.id}`;

  switch (q.type) {
    case 'textarea':
      return (
        <textarea
          id={id}
          rows={4}
          value={str}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldClass} resize-none`}
        />
      );
    case 'dropdown':
      return (
        <select id={id} value={str} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
          <option value="">Select…</option>
          {q.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case 'checkbox': {
      const picked = Array.isArray(value) ? value : [];
      return (
        <div role="group" aria-labelledby={`${id}-label`} className="space-y-2 rounded-2xl bg-white p-4">
          {q.options?.map((o) => (
            <label key={o} className="flex items-center gap-3 text-[15px] text-app-plum/75">
              <input
                type="checkbox"
                checked={picked.includes(o)}
                onChange={(e) =>
                  onChange(e.target.checked ? [...picked, o] : picked.filter((p) => p !== o))
                }
                className="h-5 w-5 accent-[#8b1a2b]"
              />
              {o}
            </label>
          ))}
        </div>
      );
    }
    case 'photo':
      return (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-app-plum/20 bg-white py-3.5 text-sm font-medium text-app-plum/60">
          <Upload size={16} aria-hidden />
          <span className="truncate">{str || 'Upload photo'}</span>
          <input
            id={id}
            type="file"
            accept={PHOTO_EXTS.join(',')}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              onPhoto(f);
              onChange(f?.name ?? '');
            }}
          />
        </label>
      );
    default:
      return (
        <input
          id={id}
          type={q.type === 'phone' ? 'tel' : q.type}
          inputMode={q.type === 'number' ? 'decimal' : undefined}
          value={str}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
        />
      );
  }
}
