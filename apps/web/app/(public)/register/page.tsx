'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, CheckCircle, IndianRupee, Upload } from 'lucide-react';
import { useActiveRegistration } from '@/hooks/useActiveRegistration';
import { useAuthStore } from '@/lib/auth-store';
import {
  validateAnswer, EMAIL_RE, PROOF_EXTS, PROOF_MAX_SIZE,
  type AnswerValue, type RegistrationQuestion,
} from '@/lib/registration';

const inputClass = 'w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-dark dark:text-white placeholder-dark/30 dark:placeholder-white/30 focus:border-accent focus:outline-none transition-colors';
const labelClass = 'block text-dark/60 dark:text-white/60 text-sm mb-1.5';

function QuestionInput({ q, value, onChange }: {
  q: RegistrationQuestion;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  const str = typeof value === 'string' ? value : '';
  const id = `q-${q.id}`;
  switch (q.type) {
    case 'textarea':
      return <textarea id={id} rows={4} value={str} onChange={e => onChange(e.target.value)} className={`${inputClass} resize-y`} />;
    case 'dropdown':
      return (
        <select id={id} value={str} onChange={e => onChange(e.target.value)} className={inputClass}>
          <option value="">Select…</option>
          {q.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case 'checkbox': {
      const picked = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-col gap-2" role="group" aria-labelledby={`${id}-label`}>
          {q.options?.map(o => (
            <label key={o} className="flex items-center gap-2 text-sm text-dark/80 dark:text-white/80 cursor-pointer">
              <input
                type="checkbox"
                checked={picked.includes(o)}
                onChange={e => onChange(e.target.checked ? [...picked, o] : picked.filter(p => p !== o))}
                className="accent-accent w-4 h-4"
              />
              {o}
            </label>
          ))}
        </div>
      );
    }
    default: {
      const type = q.type === 'phone' ? 'tel' : q.type;
      return <input id={id} type={type} inputMode={q.type === 'number' ? 'decimal' : undefined} value={str} onChange={e => onChange(e.target.value)} className={inputClass} />;
    }
  }
}

export default function RegisterPage() {
  const form = useActiveRegistration();
  const router = useRouter();
  const { token, member, _hydrated } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Email is required on every form; members get theirs prefilled until they edit it.
  const [emailEdit, setEmailEdit] = useState<string | null>(null);
  const email = emailEdit ?? member?.email ?? '';
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [proof, setProof] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Forms that need login send anonymous visitors to log in, then back here.
  const needsLogin = !!form?.auth_required && _hydrated && !token;
  useEffect(() => {
    if (needsLogin) router.replace('/login?next=%2Fregister');
  }, [needsLogin, router]);

  // Respect reduced motion: no autoplaying background video.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) videoRef.current?.pause();
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || submitting) return;
    setError('');

    const problem = (EMAIL_RE.test(email.trim()) ? null : 'Enter a valid email')
      ?? form.questions.map(q => validateAnswer(q, answers[q.id])).find(Boolean)
      ?? (form.payment_enabled && !proof ? 'Upload your payment screenshot' : null);
    if (problem) { setError(problem); return; }

    const fd = new FormData();
    fd.append('form_id', form.form_id);
    fd.append('email', email.trim());
    fd.append('answers', JSON.stringify(answers));
    if (form.payment_enabled && proof) fd.append('payment_proof', proof);

    setSubmitting(true);
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      const data = await res.json();
      if (res.ok) setDone(true);
      else setError(data.message || 'Registration failed. Try again.');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setError('');
    if (file) {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (!PROOF_EXTS.includes(ext)) { setError('Payment proof must be JPG, PNG, WEBP or PDF'); e.target.value = ''; return; }
      if (file.size > PROOF_MAX_SIZE) { setError('Payment proof must be under 5MB'); e.target.value = ''; return; }
    }
    setProof(file);
  };

  if (form === undefined || needsLogin || (form?.auth_required && !_hydrated)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (form === null) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="font-display text-4xl md:text-5xl text-dark dark:text-white mb-3">No registrations open</h1>
          <p className="text-dark/50 dark:text-white/50 mb-8">There is nothing to register for right now. Check back soon.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-7 py-3 bg-accent hover:bg-accent-light text-white rounded-full text-sm font-medium transition-colors">
            Back to Home <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  const hasMedia = !!(form.video_url || form.image_url);

  return (
    <div className="relative">
      {/* Background media stays pinned while the form scrolls over it (sticky,
          so it also works inside transformed page-transition wrappers). */}
      {hasMedia && (
        <div className="sticky top-0 h-[100svh] -mb-[100svh] w-full overflow-hidden" aria-hidden>
          {form.video_url ? (
            <video
              ref={videoRef}
              src={form.video_url}
              poster={form.image_url || undefined}
              autoPlay muted loop playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img src={form.image_url!} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
        </div>
      )}

      {/* Form sits centred in the viewport; pt clears the fixed navbar. */}
      <div className="relative z-10 min-h-[100svh] flex items-center justify-center px-4 sm:px-6 pt-28 pb-16">
        <div className="w-full max-w-2xl">
          <header className="mb-6 text-center">
            <span className={`text-[10px] tracking-[0.2em] uppercase ${hasMedia ? 'text-white/70' : 'text-dark/50 dark:text-white/50'}`}>
              Registration
            </span>
            <h1 className={`font-display text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.05] mt-3 ${hasMedia ? 'text-white' : 'text-dark dark:text-white'}`}>
              {form.title}
            </h1>
          </header>

          <div className="rounded-2xl p-6 sm:p-8 bg-white/90 dark:bg-dark-card/90 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl">
            {done ? (
              <div className="text-center py-10">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                <h2 className="font-display text-3xl text-dark dark:text-white mb-2">You&apos;re registered!</h2>
                <p className="text-dark/60 dark:text-white/60">The club will review your registration shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {form.description && (
                  <p className="text-dark/70 dark:text-white/70 leading-relaxed whitespace-pre-line">{form.description}</p>
                )}
                <div>
                  <label htmlFor="email" className={labelClass}>Email *</label>
                  <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmailEdit(e.target.value)} className={inputClass} />
                </div>

                {form.questions.map(q => (
                  <div key={q.id}>
                    <label id={`q-${q.id}-label`} htmlFor={`q-${q.id}`} className={labelClass}>
                      {q.label}{q.required && ' *'}
                    </label>
                    <QuestionInput q={q} value={answers[q.id]} onChange={v => setAnswers(a => ({ ...a, [q.id]: v }))} />
                  </div>
                ))}

                {form.payment_enabled && (
                  <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-dark/70 dark:text-white/70">Registration fee</span>
                      <span className="font-display text-2xl text-dark dark:text-white flex items-center">
                        <IndianRupee size={20} />{form.payment_amount?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    {form.payment_qr_url && (
                      <img src={form.payment_qr_url} alt="Payment QR code" className="w-56 max-w-full mx-auto rounded-xl bg-white p-2" />
                    )}
                    <div>
                      <label htmlFor="payment_proof" className={labelClass}>Payment screenshot *</label>
                      <label className={`${inputClass} cursor-pointer flex items-center gap-2`}>
                        <Upload size={16} className="text-dark/40 dark:text-white/40" />
                        <span className="text-sm text-dark/60 dark:text-white/60 truncate">{proof ? proof.name : 'Choose JPG, PNG, WEBP or PDF (max 5MB)'}</span>
                        <input id="payment_proof" type="file" accept={PROOF_EXTS.join(',')} onChange={onProof} className="sr-only" />
                      </label>
                    </div>
                  </div>
                )}

                {error && (
                  <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-colors duration-300 disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <>Submit Registration <ArrowRight size={18} /></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
