'use client';

import { useState } from 'react';
import AnimatedSection from '@/components/AnimatedSection';
import { User, Mail, Phone, Send, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-dark dark:text-white placeholder-dark/30 dark:placeholder-white/30 focus:border-accent focus:outline-none transition-colors';

const labelClass = 'block text-dark/60 dark:text-white/60 text-sm mb-1.5';

interface InterestForm {
  full_name: string;
  phone: string;
  email: string;
}

const initialForm: InterestForm = { full_name: '', phone: '', email: '' };

export default function JoinPage() {
  const [form, setForm] = useState<InterestForm>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof InterestForm, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => ({ ...prev, [key]: '' }));
    setError('');
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.full_name.trim()) errors.full_name = 'Name is required';
    else if (form.full_name.trim().length < 2) errors.full_name = 'At least 2 characters';
    if (!form.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(form.phone.trim())) errors.phone = 'Enter a 10-digit number';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Invalid email';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/membership-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || 'Could not save your details. Please try again.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const FieldError = ({ field }: { field: string }) =>
    fieldErrors[field] ? (
      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <AlertCircle size={12} /> {fieldErrors[field]}
      </p>
    ) : null;

  return (
    <div className="min-h-screen transition-colors">
      {/* Hero */}
      <section data-rota="hero" className="min-h-[55vh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-accent-light/10" />
        <div className="relative z-10 text-center px-6 max-w-4xl py-20">
          <AnimatedSection>
            <p className="text-accent font-semibold tracking-wider uppercase text-sm mb-4">
              Membership Update
            </p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-dark dark:text-white mb-6">
              <span className="gradient-text">Join Us</span>
            </h1>
            <p className="text-dark/60 dark:text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
              Registrations are closed for now — but we&apos;d still love to know you.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Message + waitlist form */}
      <section data-rota="notice" className="px-6 md:px-12 lg:px-16 pb-24">
        <div className="max-w-3xl mx-auto w-full">
          <AnimatedSection>
            <div className="p-8 md:p-10 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              <div className="flex items-start gap-3 mb-6">
                <Sparkles size={22} className="text-accent flex-shrink-0 mt-1" />
                <h2 className="font-display text-2xl md:text-3xl text-dark dark:text-white">
                  Hello! Thank you for reaching out to Rotaract Club of Bibwewadi
                </h2>
              </div>

              <div className="space-y-4 text-dark/60 dark:text-white/60 leading-relaxed">
                <p>
                  Firstly we are glad that you are interested to know more about our community.
                  However currently we have surpassed our membership limit and are currently not
                  accepting any further memberships.
                </p>
                <p>
                  If we do open up registrations in the future we will make sure to communicate
                  about the same officially. Stay tuned for further updates!
                </p>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={150}>
            <div className="mt-8 p-8 md:p-10 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              {submitted ? (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <CheckCircle size={48} className="text-accent mb-4" />
                  <h3 className="text-dark dark:text-white text-2xl font-semibold mb-2">
                    We&apos;ve got your details!
                  </h3>
                  <p className="text-dark/60 dark:text-white/60">
                    Thank you for your interest. We&apos;ll reach out to you the moment
                    memberships open up again.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-dark dark:text-white text-xl font-semibold mb-1">
                    Leave your details
                  </h3>
                  <p className="text-dark/40 dark:text-white/40 text-sm mb-6">
                    So we can reach out to you when registrations reopen.
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
                      <input type="text" value={form.full_name} placeholder="John Doe"
                        onChange={e => set('full_name', e.target.value)} className={inputClass} />
                      <FieldError field="full_name" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>
                          <Phone size={14} className="inline mr-1" />Phone *
                        </label>
                        <input type="tel" inputMode="numeric" maxLength={10} value={form.phone}
                          placeholder="9876543210"
                          onChange={e => set('phone', e.target.value.replace(/\D/g, ''))}
                          className={inputClass} />
                        <FieldError field="phone" />
                      </div>
                      <div>
                        <label className={labelClass}>
                          <Mail size={14} className="inline mr-1" />Email *
                        </label>
                        <input type="email" value={form.email} placeholder="john@example.com"
                          onChange={e => set('email', e.target.value)} className={inputClass} />
                        <FieldError field="email" />
                      </div>
                    </div>

                    <button type="button" onClick={handleSubmit} disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitting ? (
                        <>
                          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Send size={18} /> Keep Me Posted
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
