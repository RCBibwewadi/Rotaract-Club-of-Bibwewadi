'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, MapPin, IndianRupee, ArrowRight } from 'lucide-react';
import { GARBA, GARBA_PATH, registrationsClosed } from '@/lib/garba-event';

/**
 * Featured card for the Garba Workshop, used on the home page.
 *
 * The event itself lives in the `events` table like every other event, and the
 * /events page renders it from there. This card exists because the home page
 * has no upcoming-events section to slot into — it links through to /aehalo4,
 * where the registration form lives.
 */
export default function GarbaEventCard({ isDark }: { isDark: boolean }) {
  const muted = isDark ? 'text-white/55' : 'text-dark/50';
  const closed = registrationsClosed();

  return (
    <Link
      href={GARBA_PATH}
      className={`group block rounded-2xl overflow-hidden border transition-colors duration-400 ${
        isDark
          ? 'bg-dark-surface border-white/10 hover:border-accent/40'
          : 'bg-light-card border-black/10 hover:border-accent/40'
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Poster */}
        <div className="relative w-full sm:w-44 md:w-52 aspect-[4/5] sm:aspect-auto sm:self-stretch flex-shrink-0 min-h-[180px]">
          <Image
            src={GARBA.poster}
            alt={GARBA.posterAlt}
            fill
            sizes="(max-width: 640px) 100vw, 208px"
            className="object-cover object-top"
          />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 p-6 md:p-8">
          <p className="text-accent text-[11px] font-semibold tracking-[0.18em] uppercase mb-2">
            {closed ? 'Ae Haalo 4.0' : `Up next · ${GARBA.subtitle}`}
          </p>

          <h3 className="font-display text-2xl md:text-3xl tracking-tight mb-3 group-hover:text-accent transition-colors">
            {GARBA.title}
          </h3>

          <p className={`text-sm leading-relaxed ${muted} mb-5`}>
            {GARBA.description}
          </p>

          <div className={`flex flex-wrap gap-x-5 gap-y-2 text-sm ${muted} mb-6`}>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-accent" /> Sat, 26 Sep 2026
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-accent" /> 7:00 PM
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-accent" /> Deshpande Garden, Sinhagad Road
            </span>
            <span className="flex items-center gap-1.5">
              <IndianRupee size={14} className="text-accent" /> {GARBA.feeInr} per person
            </span>
          </div>

          <span className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent group-hover:bg-accent-light text-white rounded-full text-sm font-medium transition-colors duration-300">
            {closed ? 'View event' : 'Register Now'}
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}
