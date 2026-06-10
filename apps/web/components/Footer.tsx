'use client';

import Link from 'next/link';
import { Globe, ArrowUpRight } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function Footer() {
  const content = useStore((s) => s.content);

  return (
    <footer className="bg-light-card dark:bg-dark border-t border-black/10 dark:border-white/10 text-dark dark:text-white relative overflow-hidden transition-colors">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <h2 className="font-[Instrument_Serif] text-4xl md:text-5xl mb-4">
              R<span className="text-accent">C</span>B
            </h2>
            <p className="text-dark/60 dark:text-white/60 max-w-md leading-relaxed">
              {content.heroTagline}
            </p>
            <div className="flex gap-4 mt-6">
              {content.socialLinks.map((link) => {
                const Icon = ArrowUpRight;
                return (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full border border-dark/20 dark:border-white/20 flex items-center justify-center hover:bg-accent hover:border-accent hover:text-white transition-all duration-300"
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-dark/40 dark:text-white/40 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { href: '/about', label: 'About Us' },
                { href: '/projects', label: 'Projects' },
                { href: '/events', label: 'Events' },
                { href: '/board', label: 'Our Board' },
                { href: '/join', label: 'Join Us' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-dark/60 dark:text-white/60 hover:text-accent transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-dark/40 dark:text-white/40 mb-4">
              Contact
            </h3>
            <div className="space-y-3 text-dark/60 dark:text-white/60">
              <p>{content.contactEmail}</p>
              <p>{content.contactPhone}</p>
              <p>{content.contactAddress}</p>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-black/10 dark:border-white/10 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
  <p className="font-semibold text-accent">
    &copy; {new Date().getFullYear()} Rotaract Club of Bibwewadi. All rights reserved.
  </p>

  <span className="hidden md:block text-dark/20 dark:text-white/20">|</span>

  <p className="font-semibold text-accent">
    Made by USP FACE
  </p>

  <span className="hidden md:block text-dark/20 dark:text-white/20">|</span>

  <p className="font-semibold text-accent">
    District 3131 | Rotary International
  </p>
</div>
      </div>
    </footer>
  );
}
