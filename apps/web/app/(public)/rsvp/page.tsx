'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';
import AddToCalendar from '@/components/AddToCalendar';
import type { CalendarEvent } from '@/lib/calendar';
import {
  User, Mail, Phone, Building2, BadgeCheck, Send, CheckCircle, AlertCircle,
  CalendarDays, ArrowLeft,
} from 'lucide-react';

// The club is in Pune, and event times in the DB are stored as naive local time.
const EVENT_TIME_ZONE = 'Asia/Kolkata';
const EVENT_IST_OFFSET = '+05:30';
// The events table has no end time, so assume a typical installation length.
const EVENT_DURATION_HOURS = 3;

/**
 * Fallback details for the ceremony. Overridden at runtime by the matching row
 * from /api/events/upcoming, so edits made in the admin panel flow through to
 * the calendar links without a redeploy.
 */
const INSTALLATION_EVENT: CalendarEvent = {
  title: 'THE VAULT - 10th Club Installation',
  description: 'The VAULT - BOD Installation. Rotaract Club of Bibwewadi.',
  location: 'Poona Merchant Chamber, Market Yard',
  start: new Date(`2026-08-30T16:00:00${EVENT_IST_OFFSET}`),
  end: new Date(`2026-08-30T19:00:00${EVENT_IST_OFFSET}`),
  timeZone: EVENT_TIME_ZONE,
  uid: 'installation-2026@rotaractbibwewadi.in',
};

interface UpcomingEvent {
  event_id: string;
  event_name: string;
  event_date?: string | null;
  event_time?: string | null;
  event_place?: string | null;
  event_description?: string | null;
}

/** Builds calendar details from a DB event row, or null if it lacks a date. */
function toCalendarEvent(row: UpcomingEvent): CalendarEvent | null {
  if (!row.event_date) return null;

  const start = new Date(`${row.event_date}T${row.event_time || '16:00:00'}${EVENT_IST_OFFSET}`);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start.getTime() + EVENT_DURATION_HOURS * 60 * 60 * 1000);

  return {
    title: row.event_name || INSTALLATION_EVENT.title,
    description: row.event_description || INSTALLATION_EVENT.description,
    location: row.event_place || INSTALLATION_EVENT.location,
    start,
    end,
    timeZone: EVENT_TIME_ZONE,
    uid: `${row.event_id}@rotaractbibwewadi.in`,
  };
}

interface FormData {
  full_name: string;
  is_rotaractor: '' | 'yes' | 'no';
  club_name: string;
  designation: string;
  phone: string;
  email: string;
}

const initialFormData: FormData = {
  full_name: '', is_rotaractor: '', club_name: '', designation: '', phone: '', email: '',
};

const requiredFields = ['full_name', 'is_rotaractor', 'club_name', 'phone', 'email'] as const;

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-dark dark:text-white placeholder-dark/30 dark:placeholder-white/30 focus:border-accent focus:outline-none transition-colors';

const labelClass = 'block text-dark/60 dark:text-white/60 text-sm mb-1.5';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
      <AlertCircle size={12} /> {message}
    </p>
  );
}

export default function RsvpPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [calendarEvent, setCalendarEvent] = useState<CalendarEvent>(INSTALLATION_EVENT);

  // Refine the hardcoded fallback with the live event row, if one is published.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/events/upcoming');
        const data = await res.json();
        const rows: UpcomingEvent[] = data.data || [];
        const match = rows.find(r => /vault|installation/i.test(r.event_name || ''));
        if (cancelled || !match) return;
        const refined = toCalendarEvent(match);
        if (refined) setCalendarEvent(refined);
      } catch {
        // Keep the fallback details — the calendar buttons still work offline.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const set = (key: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => ({ ...prev, [key]: '' }));
    setError('');
  };

  const validateField = (key: keyof FormData): string => {
    const v = formData[key];
    switch (key) {
      case 'full_name':
        if (!v.trim()) return 'Name is required';
        if (v.trim().length < 2) return 'At least 2 characters';
        return '';
      case 'is_rotaractor':
        return v ? '' : 'Please select an option';
      case 'club_name':
        return v.trim() ? '' : 'Club name is required';
      case 'phone':
        if (!v.trim()) return 'Phone number is required';
        if (!/^\+?[\d\s-]{7,20}$/.test(v.trim())) return 'Invalid phone number';
        return '';
      case 'email':
        if (!v.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Invalid email';
        return '';
      default:
        return '';
    }
  };

  const blur = (key: keyof FormData) => {
    setFieldErrors(prev => ({ ...prev, [key]: validateField(key) }));
  };

  const isComplete = (): boolean => requiredFields.every(k => !validateField(k));

  const handleSubmit = async () => {
    const errors: Record<string, string> = {};
    requiredFields.forEach(k => {
      const err = validateField(k);
      if (err) errors[k] = err;
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the highlighted fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          is_rotaractor: formData.is_rotaractor === 'yes',
          club_name: formData.club_name.trim(),
          ...(formData.designation.trim() && { designation: formData.designation.trim() }),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Could not submit your RSVP. Please try again.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen transition-colors">
      {/* Hero */}
      <section data-rota="hero" className="min-h-[50vh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-accent-light/10" />
        <div className="relative z-10 text-center px-6 max-w-4xl py-20">
          <AnimatedSection>
            <p className="text-accent font-semibold tracking-wider uppercase text-sm mb-4">
              The Vault
            </p>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-dark dark:text-white mb-6">
              <span className="gradient-text">10th Installation Ceremony</span>
            </h1>
            <p className="text-dark/60 dark:text-white/60 text-lg md:text-xl max-w-2xl mx-auto flex items-center justify-center gap-2">
              <CalendarDays size={20} className="text-accent" />
              Sunday, 30 August
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Form */}
      <section data-rota="rsvp-form" className="px-6 md:px-12 lg:px-16 pb-20">
        <div className="max-w-xl mx-auto w-full">
          <AnimatedSection>
            <div className="p-8 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              {submitted ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <CheckCircle size={48} className="text-accent mb-4" />
                  <h3 className="text-dark dark:text-white text-2xl font-semibold mb-2">
                    You&apos;re on the list!
                  </h3>
                  <p className="text-dark/60 dark:text-white/60 mb-6">
                    Thanks for your RSVP, {formData.full_name.trim().split(' ')[0]}. We can&apos;t
                    wait to see you on 30 August.
                  </p>

                  <AddToCalendar event={calendarEvent} filename="the-vault-installation.ics" />

                  <Link href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 mt-6 rounded-xl border border-black/10 dark:border-white/10 text-dark dark:text-white font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <ArrowLeft size={16} /> Back to Home
                  </Link>
                </div>
              ) : (
                <div>
                  <h3 className="text-dark dark:text-white text-xl font-semibold mb-1">
                    RSVP
                  </h3>
                  <p className="text-dark/40 dark:text-white/40 text-sm mb-6">
                    Fill in your details to confirm your seat.
                  </p>

                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>
                        <User size={14} className="inline mr-1" />Full Name *
                      </label>
                      <input type="text" value={formData.full_name}
                        onChange={e => set('full_name', e.target.value)}
                        onBlur={() => blur('full_name')}
                        placeholder="John Doe" className={inputClass} />
                      <FieldError message={fieldErrors.full_name} />
                    </div>

                    <div>
                      <label className={labelClass}>
                        <BadgeCheck size={14} className="inline mr-1" />Are you a Rotaractor? *
                      </label>
                      <div className="grid grid-cols-2 gap-3 mt-1">
                        {([['yes', 'Yes'], ['no', 'No']] as const).map(([value, label]) => {
                          const active = formData.is_rotaractor === value;
                          return (
                            <button key={value} type="button"
                              onClick={() => set('is_rotaractor', value)}
                              className={`py-3 rounded-xl border font-medium text-sm transition-all duration-200 ${
                                active
                                  ? 'border-accent bg-accent/10 ring-1 ring-accent text-accent'
                                  : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-dark dark:text-white hover:border-accent/50'
                              }`}>
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      <FieldError message={fieldErrors.is_rotaractor} />
                    </div>

                    <div>
                      <label className={labelClass}>
                        <Building2 size={14} className="inline mr-1" />Club Name *
                      </label>
                      <input type="text" value={formData.club_name}
                        onChange={e => set('club_name', e.target.value)}
                        onBlur={() => blur('club_name')}
                        placeholder="NA if not in any Club" className={inputClass} />
                      <FieldError message={fieldErrors.club_name} />
                    </div>

                    <div>
                      <label className={labelClass}>Designation</label>
                      <input type="text" value={formData.designation}
                        onChange={e => set('designation', e.target.value)}
                        placeholder="Member by default" className={inputClass} />
                    </div>

                    <div>
                      <label className={labelClass}>
                        <Phone size={14} className="inline mr-1" />Phone Number *
                      </label>
                      <input type="tel" value={formData.phone}
                        onChange={e => set('phone', e.target.value)}
                        onBlur={() => blur('phone')}
                        placeholder="+91 98765 43210" className={inputClass} />
                      <FieldError message={fieldErrors.phone} />
                    </div>

                    <div>
                      <label className={labelClass}>
                        <Mail size={14} className="inline mr-1" />Email *
                      </label>
                      <input type="email" value={formData.email}
                        onChange={e => set('email', e.target.value)}
                        onBlur={() => blur('email')}
                        placeholder="john@example.com" className={inputClass} />
                      <FieldError message={fieldErrors.email} />
                    </div>
                  </div>

                  <button type="button" onClick={handleSubmit}
                    disabled={submitting || !isComplete()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 mt-6 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={18} /> Submit RSVP
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
