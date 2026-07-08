'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Tag, Users, Award } from 'lucide-react';
import AnimatedSection from '@/components/AnimatedSection';



interface EventItem {
  event_id: string;
  event_name: string;
  event_date?: string;
  event_time?: string;
  event_place?: string;
  event_strength?: number;
  open_to_all: boolean;
  event_avenue?: string;
  event_description?: string;
  event_images?: string[];
  best_member?: {
    member_id: string;
    full_name: string;
    avatar_url?: string;
  } | null;
}

export default function EventsPage() {
  const [upcoming, setUpcoming] = useState<EventItem[]>([]);
  const [past, setPast] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [upRes, pastRes] = await Promise.all([
          fetch(`/api/events/upcoming`),
          fetch(`/api/events/past`),
        ]);
        const [upData, pastData] = await Promise.all([upRes.json(), pastRes.json()]);
        if (!cancelled) {
          setUpcoming(upData.data || []);
          setPast(pastData.data || []);
        }
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const events = view === 'upcoming' ? upcoming : past;

  return (
    <div className="min-h-screen transition-colors">
      {/* Hero */}
      <section data-rota="hero" className="min-h-[60vh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
        <div className="relative z-10 text-center px-6 max-w-4xl py-20">
          <AnimatedSection>
            <p className="text-accent font-semibold tracking-wider uppercase text-sm mb-4">
              What&apos;s Happening
            </p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-dark dark:text-white mb-6">
              <span className="gradient-text">Events</span>
            </h1>
            <p className="text-dark/60 dark:text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
              Join us for exciting events, workshops, and celebrations.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Events List */}
      <section data-rota="events" className="py-20 px-6 md:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto w-full">
          {/* Toggle */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setView('upcoming')}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                view === 'upcoming'
                  ? 'bg-accent text-white'
                  : 'bg-black/5 dark:bg-white/5 text-dark/50 dark:text-white/50 hover:text-dark dark:hover:text-white'
              }`}
            >
              Upcoming ({upcoming.length})
            </button>
            <button
              onClick={() => setView('past')}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                view === 'past'
                  ? 'bg-accent text-white'
                  : 'bg-black/5 dark:bg-white/5 text-dark/50 dark:text-white/50 hover:text-dark dark:hover:text-white'
              }`}
            >
              Past ({past.length})
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          )}

          {!loading && events.length === 0 && (
            <div className="text-center py-20">
              <Calendar size={40} className="text-dark/10 dark:text-white/10 mx-auto mb-4" />
              <p className="text-dark/40 dark:text-white/40 text-lg">
                {view === 'upcoming' ? 'No upcoming events' : 'No past events'}
              </p>
            </div>
          )}

          <div className="space-y-4">
            {events.map((event, i) => {
              const date = event.event_date ? new Date(event.event_date) : null;
              return (
                <AnimatedSection key={event.event_id} delay={i * 80}>
                  <div className="group flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-accent/30 transition-all duration-300">
                    {/* Date block */}
                    <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-accent/10 border border-accent/20 flex flex-col items-center justify-center">
                      {date ? (
                        <>
                          <span className="text-accent text-2xl font-bold leading-none">
                            {date.getDate()}
                          </span>
                          <span className="text-accent/70 text-xs uppercase mt-1">
                            {date.toLocaleDateString('en-IN', { month: 'short' })}
                          </span>
                        </>
                      ) : (
                        <span className="text-accent/50 text-sm">TBD</span>
                      )}
                    </div>

                    {/* Cover image */}
                    {event.event_images?.[0] && (
                      <div className="flex-shrink-0 w-full md:w-32 h-20 rounded-xl overflow-hidden">
                        <img src={event.event_images[0]} alt={event.event_name} className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-dark dark:text-white text-xl font-semibold">
                          {event.event_name}
                        </h3>
                        <div className="flex gap-2 flex-shrink-0">
                          {event.event_avenue && (
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                              <Tag size={12} />
                              {event.event_avenue}
                            </span>
                          )}
                          {event.open_to_all && (
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                              <Users size={12} /> Open
                            </span>
                          )}
                        </div>
                      </div>
                      {event.event_description && (
                        <p className="text-dark/50 dark:text-white/50 text-sm leading-relaxed mb-3">
                          {event.event_description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-dark/40 dark:text-white/40 text-sm">
                        {event.event_time && (
                          <span className="flex items-center gap-1">
                            <Clock size={14} /> {event.event_time}
                          </span>
                        )}
                        {event.event_place && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} /> {event.event_place}
                          </span>
                        )}
                        {date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />{' '}
                            {date.toLocaleDateString('en-IN', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                        {event.event_strength && (
                          <span className="flex items-center gap-1">
                            <Users size={14} /> {event.event_strength} members
                          </span>
                        )}
                      </div>
                      {event.best_member && (
                        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                          <Award size={16} className="text-yellow-500 flex-shrink-0" />
                          <div className="flex items-center gap-2">
                            {event.best_member.avatar_url && (
                              <img src={event.best_member.avatar_url} alt={event.best_member.full_name} className="w-6 h-6 rounded-full object-cover" />
                            )}
                            <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                              Best Member: {event.best_member.full_name}
                            </span>
                          </div>
                        </div>
                      )}
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
