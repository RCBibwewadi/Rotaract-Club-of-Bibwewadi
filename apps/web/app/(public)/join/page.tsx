'use client';

import { useState } from 'react';
import AnimatedSection from '@/components/AnimatedSection';
import { Users, Award, Globe, Heart, Send, CheckCircle } from 'lucide-react';

const benefits = [
  { icon: Users, title: 'Community', desc: 'Join 200+ passionate members who share your vision.' },
  { icon: Award, title: 'Leadership', desc: 'Develop real-world skills through project management.' },
  { icon: Globe, title: 'Network', desc: 'Connect with Rotaract clubs worldwide through RI.' },
  { icon: Heart, title: 'Impact', desc: 'Make tangible difference in your community every day.' },
];

export default function JoinPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', age: '', occupation: '', why: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-light dark:bg-dark transition-colors">
      {/* Hero */}
      <section data-rota="hero" className="min-h-[60vh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-accent-light/10" />
        <div className="relative z-10 text-center px-6 max-w-4xl py-20">
          <AnimatedSection>
            <p className="text-accent font-semibold tracking-wider uppercase text-sm mb-4">
              Be Part of Something Big
            </p>
            <h1 className="font-[Instrument_Serif] text-5xl md:text-7xl lg:text-8xl text-dark dark:text-white mb-6">
              <span className="gradient-text">Join Us</span>
            </h1>
            <p className="text-dark/60 dark:text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
              Take the first step towards becoming a leader who serves.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Benefits + Form */}
      <section data-rota="benefits" className="px-6 md:px-12 lg:px-16 py-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Benefits */}
            <div>
              <AnimatedSection>
                <h2 className="font-[Instrument_Serif] text-3xl md:text-5xl text-dark dark:text-white mb-8">
                  Why Join RCB?
                </h2>
              </AnimatedSection>
              <div className="space-y-4">
                {benefits.map((b, i) => (
                  <AnimatedSection key={i} delay={i * 100}>
                    <div className="flex gap-4 p-5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                      <b.icon size={24} className="text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-dark dark:text-white font-semibold mb-1">{b.title}</h3>
                        <p className="text-dark/50 dark:text-white/50 text-sm">{b.desc}</p>
                      </div>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>

            {/* Form */}
            <AnimatedSection delay={200}>
              <div className="p-8 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <CheckCircle size={48} className="text-accent mb-4" />
                    <h3 className="text-dark dark:text-white text-2xl font-semibold mb-2">
                      Application Received!
                    </h3>
                    <p className="text-dark/60 dark:text-white/60">
                      We&apos;ll get back to you soon. Welcome to the RCB family!
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="text-dark dark:text-white text-xl font-semibold mb-4">
                      Membership Application
                    </h3>
                    {[
                      { key: 'name', label: 'Full Name', type: 'text' },
                      { key: 'email', label: 'Email', type: 'email' },
                      { key: 'phone', label: 'Phone', type: 'tel' },
                      { key: 'age', label: 'Age', type: 'number' },
                      { key: 'occupation', label: 'Occupation', type: 'text' },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="block text-dark/60 dark:text-white/60 text-sm mb-1">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          required
                          value={formData[field.key as keyof typeof formData]}
                          onChange={(e) =>
                            setFormData({ ...formData, [field.key]: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-dark dark:text-white placeholder-dark/30 dark:placeholder-white/30 focus:border-accent focus:outline-none transition-colors"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-dark/60 dark:text-white/60 text-sm mb-1">
                        Why do you want to join?
                      </label>
                      <textarea
                        rows={3}
                        value={formData.why}
                        onChange={(e) => setFormData({ ...formData, why: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-dark dark:text-white placeholder-dark/30 dark:placeholder-white/30 focus:border-accent focus:outline-none transition-colors resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-colors duration-300"
                    >
                      <Send size={18} />
                      Submit Application
                    </button>
                  </form>
                )}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </div>
  );
}
