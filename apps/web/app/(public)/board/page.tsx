'use client';

import { useStore } from '@/lib/store';
import AnimatedSection from '@/components/AnimatedSection';

export default function BoardPage() {
  const boardMembers = useStore((s) => s.content.boardMembers);

  return (
    <div className="min-h-screen bg-light dark:bg-dark transition-colors">
      {/* Hero */}
      <section data-rota="hero" className="min-h-[60vh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
        <div className="relative z-10 text-center px-6 max-w-4xl py-20">
          <AnimatedSection>
            <p className="text-accent font-semibold tracking-wider uppercase text-sm mb-4">
              Leadership
            </p>
            <h1 className="font-[Instrument_Serif] text-5xl md:text-7xl lg:text-8xl text-dark dark:text-white mb-6">
              Our <span className="gradient-text">Board</span>
            </h1>
            <p className="text-dark/60 dark:text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
              Meet the passionate leaders driving our mission forward.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Director Cards */}
      <section data-rota="board" className="py-20 px-6 md:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          <AnimatedSection>
            <h2 className="font-[Instrument_Serif] text-3xl md:text-5xl text-dark dark:text-white mb-8">
              Board of Directors 2025-26
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boardMembers.map((member, i) => (
              <AnimatedSection key={member.id} delay={i * 80}>
                <div className="group rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-accent/30 transition-all duration-300">
                  <div className={`h-48 bg-gradient-to-br ${member.gradient} relative flex items-center justify-center`}>
                    <span className="text-white/30 font-[Instrument_Serif] text-6xl">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div className="p-6">
                    <p className="text-accent text-sm font-medium mb-1">{member.role}</p>
                    <h3 className="text-dark dark:text-white text-xl font-semibold mb-2">{member.name}</h3>
                    <p className="text-dark/50 dark:text-white/50 text-sm leading-relaxed">{member.bio}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
