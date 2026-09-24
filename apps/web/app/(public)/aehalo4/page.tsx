'use client';

import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  User, Phone, Users, IndianRupee, Upload, Send, CheckCircle, AlertCircle,
  Calendar, Clock, MapPin, Copy, Check, Smartphone, Shirt, ArrowLeft,
} from 'lucide-react';
import AnimatedSection from '@/components/AnimatedSection';
import { GARBA, UPI, UPI_URI, registrationsClosed } from '@/lib/garba-event';

// text-base (16px) on the input matters: anything smaller makes iOS Safari
// zoom the page in when the field takes focus, and it never zooms back out.
const inputClass =
  'w-full px-4 py-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-dark dark:text-white text-base placeholder-dark/30 dark:placeholder-white/30 focus:border-accent focus:outline-none transition-colors';

const labelClass = 'block text-dark/60 dark:text-white/60 text-sm mb-1.5';

interface FormState {
  full_name: string;
  phone: string;
  reference: string;
}

const EMPTY: FormState = { full_name: '', phone: '', reference: '' };

/** The cutoff never changes while the page is open, so there is nothing to subscribe to. */
const subscribeNever = () => () => {};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
      <AlertCircle size={12} /> {message}
    </p>
  );
}

export default function GarbaWorkshopPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ full_name: string; reference_code: string } | null>(null);
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);

  // The cutoff is read on the client only, so the server-rendered markup and
  // the first client render agree. The API enforces it again on submit.
  const closed = useSyncExternalStore(subscribeNever, registrationsClosed, () => false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(UPI_URI, { width: 512, margin: 1, errorCorrectionLevel: 'M' })
      .then(url => { if (!cancelled) setQr(url); })
      .catch(() => { /* the UPI id and pay button still work without the QR */ });
    return () => { cancelled = true; };
  }, []);

  const eventDate = useMemo(() => new Date(GARBA.date), []);

  const set = (key: keyof FormState, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    setFieldErrors(e => (e[key] ? { ...e, [key]: '' } : e));
  };

  const copyVpa = async () => {
    try {
      await navigator.clipboard.writeText(UPI.vpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked — the id is on screen anyway */ }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    const name = form.full_name.trim();
    if (name.length < 2 || name.length > 100) errs.full_name = 'Enter your name (2-100 characters)';

    const digits = form.phone.replace(/\D/g, '');
    const local =
      digits.length === 12 && digits.startsWith('91') ? digits.slice(2)
      : digits.length === 11 && digits.startsWith('0') ? digits.slice(1)
      : digits;
    if (!/^[6-9]\d{9}$/.test(local)) errs.phone = 'Enter a valid 10-digit Indian mobile number';

    if (form.reference.trim().length > 100) errs.reference = 'Keep this under 100 characters';

    if (!file) errs.payment_screenshot = 'Attach a screenshot of your payment';
    else if (file.size > 10 * 1024 * 1024) errs.payment_screenshot = 'That file is larger than 10 MB';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const body = new FormData();
      body.append('full_name', form.full_name);
      body.append('phone', form.phone);
      body.append('reference', form.reference);
      body.append('website', honeypot);
      if (file) body.append('payment_screenshot', file);

      const res = await fetch('/api/events/garba-workshop-2026/register', { method: 'POST', body });
      const data = await res.json();

      if (!res.ok) {
        // Everything the user typed stays put — they only fix what failed.
        const field = data?.error?.field;
        if (field) setFieldErrors({ [field]: data.message || 'Please check this field' });
        else setError(data?.message || data?.error?.message || 'Something went wrong. Please try again.');
        return;
      }

      setDone(data.data);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen transition-colors">
      {/* Hero */}
      <section data-rota="hero" className="pt-24 sm:pt-28 pb-10 px-4 sm:px-6 md:px-12 lg:px-16">
        <div className="max-w-3xl mx-auto w-full">
          <AnimatedSection>
            <Link href="/events"
              className="inline-flex items-center gap-1.5 text-sm text-dark/40 dark:text-white/40 hover:text-accent transition-colors mb-6">
              <ArrowLeft size={14} /> All events
            </Link>

            {/* Poster supplied by the club (the Ae Haalo 4.0 artwork), so there
                is no stock-photo credit to carry here. */}
            <div className="relative w-full aspect-[3/2] sm:aspect-[16/10] rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 mb-6 sm:mb-8">
              <Image
                src={GARBA.poster}
                alt={GARBA.posterAlt}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover object-top"
              />
            </div>

            <p className="text-accent font-semibold tracking-wider uppercase text-sm mb-3">
              {GARBA.subtitle}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl md:text-6xl text-dark dark:text-white mb-4 sm:mb-5">
              <span className="gradient-text">{GARBA.title}</span>
            </h1>
            <p className="text-dark/60 dark:text-white/60 text-base md:text-lg leading-relaxed mb-6">
              {GARBA.description}
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-2.5 text-dark/50 dark:text-white/50 text-sm">
              <span className="flex items-start gap-1.5">
                <Calendar size={15} className="text-accent flex-shrink-0 mt-0.5" />
                {eventDate.toLocaleDateString('en-IN', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={15} className="text-accent" /> {GARBA.timeLabel}
              </span>
              <span className="flex items-start gap-1.5">
                <MapPin size={15} className="text-accent flex-shrink-0 mt-0.5" /> {GARBA.venue}
              </span>
              <span className="flex items-center gap-1.5">
                <Shirt size={15} className="text-accent" /> Dress code: {GARBA.dressCode}
              </span>
              <span className="flex items-center gap-1.5">
                <IndianRupee size={15} className="text-accent" /> {GARBA.feeInr} per person
              </span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Registration form */}
      <section data-rota="register" className="pb-20 px-4 sm:px-6 md:px-12 lg:px-16">
        <div className="max-w-3xl mx-auto w-full">
          <AnimatedSection>
            <div className="p-5 sm:p-6 md:p-10 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">

              {closed ? (
                <div className="text-center py-10">
                  <Calendar size={40} className="text-dark/15 dark:text-white/15 mx-auto mb-4" />
                  <p className="text-dark/50 dark:text-white/50 text-lg">
                    Registrations for this event are closed.
                  </p>
                </div>
              ) : done ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle size={30} className="text-green-500" />
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl md:text-3xl text-dark dark:text-white mb-3">
                    You&apos;re registered for the Garba Workshop! 🎉
                  </h2>
                  <p className="text-dark/60 dark:text-white/60 leading-relaxed max-w-md mx-auto mb-6">
                    We&apos;ll verify your payment and see you on 26 September at 7 PM,
                    Deshpande Garden, Sinhagad Road.
                  </p>
                  <div className="flex flex-col sm:inline-flex sm:flex-row items-center gap-x-8 gap-y-4 px-5 sm:px-6 py-4 rounded-xl bg-accent/5 border border-accent/20">
                    <div>
                      <p className="text-dark/40 dark:text-white/40 text-xs uppercase tracking-wider mb-1">Name</p>
                      <p className="text-dark dark:text-white font-medium">{done.full_name}</p>
                    </div>
                    <div>
                      <p className="text-dark/40 dark:text-white/40 text-xs uppercase tracking-wider mb-1">Reference</p>
                      <p className="text-accent font-mono font-semibold tracking-wider">{done.reference_code}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Form header */}
                  <div className="mb-8">
                    <h2 className="font-display text-2xl md:text-3xl text-dark dark:text-white mb-2">
                      {GARBA.title}
                    </h2>
                    <p className="text-dark/50 dark:text-white/50 text-sm">
                      {GARBA.headerSubtext}
                    </p>
                  </div>

                  {error && (
                    <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                      <AlertCircle size={16} className="flex-shrink-0" /> {error}
                    </div>
                  )}

                  <div className="space-y-5">
                    {/* 1 — Name */}
                    <div>
                      <label className={labelClass}>
                        <User size={14} className="inline mr-1" />Name *
                      </label>
                      <input type="text" value={form.full_name}
                        onChange={e => set('full_name', e.target.value)}
                        autoComplete="name" autoCapitalize="words" enterKeyHint="next"
                        placeholder="Your full name" className={inputClass} />
                      <FieldError message={fieldErrors.full_name} />
                    </div>

                    {/* 2 — Phone */}
                    <div>
                      <label className={labelClass}>
                        <Phone size={14} className="inline mr-1" />Phone Number *
                      </label>
                      <input type="tel" inputMode="numeric" value={form.phone}
                        onChange={e => set('phone', e.target.value)}
                        autoComplete="tel" enterKeyHint="next"
                        placeholder="98765 43210" className={inputClass} />
                      <FieldError message={fieldErrors.phone} />
                    </div>

                    {/* 3 — Reference (optional) */}
                    <div>
                      <label className={labelClass}>
                        <Users size={14} className="inline mr-1" />
                        Reference (through whom have you come)
                        <span className="text-dark/30 dark:text-white/30 font-normal"> — optional</span>
                      </label>
                      <input type="text" value={form.reference}
                        onChange={e => set('reference', e.target.value)}
                        autoCapitalize="words" enterKeyHint="done"
                        placeholder="Name of the person who invited you" className={inputClass} />
                      <FieldError message={fieldErrors.reference} />
                    </div>

                    {/* 4 — Payment */}
                    <div>
                      <label className={labelClass}>
                        <IndianRupee size={14} className="inline mr-1" />
                        Pay {GARBA.feeInr}/- On the Below QR Code *
                      </label>

                      <div className="p-4 sm:p-5 rounded-xl bg-accent/5 border border-accent/20 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                          {/* QR */}
                          <div className="flex-shrink-0 mx-auto sm:mx-0">
                            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl bg-white p-2 border border-accent/20 flex items-center justify-center">
                              {qr ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={qr} alt={`UPI QR code to pay ${GARBA.feeInr} rupees to ${UPI.payee}`}
                                  className="w-full h-full" />
                              ) : (
                                <div className="h-6 w-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                              )}
                            </div>
                            <p className="text-dark/40 dark:text-white/40 text-xs text-center mt-2">
                              Scan to pay with any UPI app
                            </p>
                          </div>

                          {/* Payee details */}
                          <div className="flex-1 min-w-0 space-y-3">
                            <div>
                              <p className="text-dark/40 dark:text-white/40 text-xs uppercase tracking-wider mb-0.5">Payee</p>
                              <p className="text-dark dark:text-white font-medium">{UPI.payee}</p>
                            </div>
                            <div>
                              <p className="text-dark/40 dark:text-white/40 text-xs uppercase tracking-wider mb-1">UPI ID</p>
                              <div className="flex items-center gap-2 min-w-0">
                                <code className="text-dark dark:text-white text-sm truncate">{UPI.vpa}</code>
                                <button type="button" onClick={copyVpa}
                                  aria-label="Copy UPI ID"
                                  className="flex-shrink-0 p-1.5 rounded-lg border border-black/10 dark:border-white/10 text-dark/40 dark:text-white/40 hover:text-accent hover:border-accent/40 transition-colors">
                                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                </button>
                              </div>
                            </div>
                            <div>
                              <p className="text-dark/40 dark:text-white/40 text-xs uppercase tracking-wider mb-0.5">Amount</p>
                              <p className="text-accent font-bold text-xl">&#8377;{GARBA.feeInr}</p>
                            </div>
                          </div>
                        </div>

                        {/* Opens the UPI app on a phone; harmless on desktop,
                            where the QR beside it is the way to pay. */}
                        <a href={UPI_URI}
                          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-light active:bg-accent-light transition-colors">
                          <Smartphone size={18} /> Pay &#8377;{GARBA.feeInr} via UPI app
                        </a>
                      </div>
                    </div>

                    {/* 5 — Screenshot */}
                    <div>
                      <label className={labelClass}>
                        <Upload size={14} className="inline mr-1" />Share Screenshot of Payment *
                      </label>
                      {file ? (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                          <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                          <span className="text-green-600 dark:text-green-400 text-sm flex-1 truncate">{file.name}</span>
                          <button type="button" onClick={() => setFile(null)}
                            className="text-xs text-dark/40 dark:text-white/40 hover:text-red-400 transition-colors flex-shrink-0">
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className={`${inputClass} cursor-pointer flex items-center gap-2 py-4`}>
                          <Upload size={16} className="text-dark/30 dark:text-white/30 flex-shrink-0" />
                          <span className="text-dark/30 dark:text-white/30 text-sm">Choose screenshot or PDF</span>
                          <input type="file" className="hidden"
                            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
                            onChange={e => {
                              const f = e.target.files?.[0] || null;
                              setFile(f);
                              setFieldErrors(er => ({ ...er, payment_screenshot: '' }));
                            }} />
                        </label>
                      )}
                      <FieldError message={fieldErrors.payment_screenshot} />
                    </div>

                    {/* Honeypot — hidden from people, catches scripted posts */}
                    <input type="text" name="website" value={honeypot} tabIndex={-1} autoComplete="off"
                      aria-hidden="true" onChange={e => setHoneypot(e.target.value)}
                      className="absolute left-[-9999px] w-px h-px opacity-0" />

                    <button type="button" onClick={handleSubmit} disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent text-white rounded-xl font-semibold text-base hover:bg-accent-light active:bg-accent-light transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitting ? (
                        <>
                          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={18} /> Submit
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
