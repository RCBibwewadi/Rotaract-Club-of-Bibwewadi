'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import AnimatedSection from '@/components/AnimatedSection';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { FaInstagram, FaLinkedinIn} from "react-icons/fa";
import { MdEmail } from "react-icons/md";

export default function ContactPage() {
  const content = useStore((s) => s.content);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen transition-colors">
      {/* Hero */}
      <section data-rota="hero" className="min-h-[60vh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
        <div className="relative z-10 text-center px-6 max-w-4xl py-20">
          <AnimatedSection>
            <p className="text-accent font-semibold tracking-wider uppercase text-sm mb-4">
              Get In Touch
            </p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-dark dark:text-white mb-6">
              <span className="gradient-text">Contact</span>
            </h1>
            <p className="text-dark/60 dark:text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
              We&apos;d love to hear from you. Reach out anytime.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Info + Form */}
      <section data-rota="form" className="py-20 px-6 md:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact info */}
            <div>
              <AnimatedSection>
                <h2 className="font-display text-3xl md:text-5xl text-dark dark:text-white mb-8">
                  Let&apos;s Connect
                </h2>
              </AnimatedSection>
              <div className="space-y-6">
                <AnimatedSection delay={100}>
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Mail size={20} className="text-accent" />
                    </div>
                    <div>
                      <h3 className="text-dark dark:text-white font-semibold mb-1">Email</h3>
                      <p className="text-dark/60 dark:text-white/60">{content.contactEmail}</p>
                    </div>
                  </div>
                </AnimatedSection>
                <AnimatedSection delay={200}>
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Phone size={20} className="text-accent" />
                    </div>
                    <div>
                      <h3 className="text-dark dark:text-white font-semibold mb-1">Phone</h3>
                      <p className="text-dark/60 dark:text-white/60">{content.contactPhone}</p>
                    </div>
                  </div>
                </AnimatedSection>
                <AnimatedSection delay={300}>
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <MapPin size={20} className="text-accent" />
                    </div>
                    <div>
                      <h3 className="text-dark dark:text-white font-semibold mb-1">Address</h3>
                      <p className="text-dark/60 dark:text-white/60">{content.contactAddress}</p>
                    </div>
                  </div>
                </AnimatedSection>
                <AnimatedSection delay={400}>
                  <div className="pt-6 border-t border-black/10 dark:border-white/10">
                    <p className="text-dark/40 dark:text-white/40 text-sm uppercase tracking-wider mb-3">Follow Us</p>
                    <div className="flex gap-3">
                      {content.socialLinks.map((link, index) => {
                        const icons = [FaInstagram, MdEmail, FaLinkedinIn];
                        const Icon = icons[index] ?? Mail;
                        return (
                          <a
                            key={link.platform}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-full border border-dark/20 dark:border-white/20 flex items-center justify-center text-dark/60 dark:text-white/60 hover:bg-accent hover:border-accent hover:text-white transition-all duration-300"
                          >
                            <Icon size={18} />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </div>

            {/* Form */}
            <AnimatedSection delay={200}>
              <div className="p-8 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <CheckCircle size={48} className="text-accent mb-4" />
                    <h3 className="text-dark dark:text-white text-2xl font-semibold mb-2">Message Sent!</h3>
                    <p className="text-dark/60 dark:text-white/60">We&apos;ll get back to you as soon as possible.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="text-dark dark:text-white text-xl font-semibold mb-4">Send a Message</h3>
                    {[
                      { key: 'name', label: 'Your Name', type: 'text' },
                      { key: 'email', label: 'Email Address', type: 'email' },
                      { key: 'subject', label: 'Subject', type: 'text' },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="block text-dark/60 dark:text-white/60 text-sm mb-1">{field.label}</label>
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
                      <label className="block text-dark/60 dark:text-white/60 text-sm mb-1">Message</label>
                      <textarea
                        rows={4}
                        required
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-dark dark:text-white placeholder-dark/30 dark:placeholder-white/30 focus:border-accent focus:outline-none transition-colors resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-colors duration-300"
                    >
                      <Send size={18} />
                      Send Message
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
