'use client';

import { useStore } from '@/lib/store';
import AnimatedSection from '@/components/AnimatedSection';
import { Calendar, Clock, MapPin, Tag } from 'lucide-react';

export default function EventsPage() {
  const events = useStore((s) => s.content.events);

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="min-h-screen bg-light dark:bg-dark transition-colors">
      {/* Hero */}
      <section data-rota="hero" className="min-h-[60vh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
        <div className="relative z-10 text-center px-6 max-w-4xl py-20">
          <AnimatedSection>
            <p className="text-accent font-semibold tracking-wider uppercase text-sm mb-4">
              What&apos;s Happening
            </p>
            <h1 className="font-[Instrument_Serif] text-5xl md:text-7xl lg:text-8xl text-dark dark:text-white mb-6">
              <span className="gradient-text">Events</span>
            </h1>
            <p className="text-dark/60 dark:text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
              Join us for exciting events, workshops, and celebrations.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Calendar/List */}
      <section data-rota="events" className="py-20 px-6 md:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto w-full">
          <AnimatedSection>
            <h2 className="font-[Instrument_Serif] text-3xl md:text-5xl text-dark dark:text-white mb-8">
              Upcoming Events
            </h2>
          </AnimatedSection>

          <div className="space-y-4">
            {sortedEvents.map((event, i) => {
              const date = new Date(event.date);
              return (
                <AnimatedSection key={event.id} delay={i * 100}>
                  <div className="group flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-accent/30 transition-all duration-300">
                    {/* Date block */}
                    <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-accent/10 border border-accent/20 flex flex-col items-center justify-center">
                      <span className="text-accent text-2xl font-bold leading-none">
                        {date.getDate()}
                      </span>
                      <span className="text-accent/70 text-xs uppercase mt-1">
                        {date.toLocaleDateString('en-IN', { month: 'short' })}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-dark dark:text-white text-xl font-semibold">
                          {event.title}
                        </h3>
                        <span className="flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                          <Tag size={12} />
                          {event.category}
                        </span>
                      </div>
                      <p className="text-dark/50 dark:text-white/50 text-sm leading-relaxed mb-3">
                        {event.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-dark/40 dark:text-white/40 text-sm">
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} /> {event.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />{' '}
                          {date.toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
