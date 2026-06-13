'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import AnimatedSection from '@/components/AnimatedSection';
import { Sprout, Handshake, Rocket, Heart, Users, Award, Calendar, Globe } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Sprout, Handshake, Rocket, Heart, Users, Award, Calendar, Globe,
};

const statIcons = [Users, Award, Calendar, Globe];

export default function AboutPage() {
  const { content, fetchContent } = useStore();

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const stats = content.stats || [];
  const pillars = content.pillars || [];

  return (
    <div className="min-h-screen transition-colors">
      {/* Hero */}
      <section data-rota="hero" className="min-h-[60vh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
        <div className="relative z-10 text-center px-6 max-w-4xl py-20">
          <AnimatedSection>
            <p className="text-accent font-semibold tracking-wider uppercase text-sm mb-4">About Us</p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-dark dark:text-white mb-6">
              Our <span className="gradient-text">Story</span>
            </h1>
            <p className="text-dark/60 dark:text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
              A journey of service, leadership, and community building.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Story */}
      <section data-rota="story" className="py-20 px-6 md:px-12 lg:px-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <AnimatedSection delay={200}>
            <div>
              <p className="text-accent font-semibold tracking-wider uppercase text-sm mb-3">Who We Are</p>
              <h2 className="font-display text-3xl md:text-5xl text-dark dark:text-white mb-6">
                Rotary International
              </h2>
              <p className="text-dark/60 dark:text-white/60 leading-relaxed text-lg">
                {content.aboutText}
              </p>
            </div>
          </AnimatedSection>
          <AnimatedSection>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-white p-1 overflow-hidden">
                {content.aboutImage ? (
                  <img src={content.aboutImage} alt="About RCB" className="w-full h-full rounded-3xl object-cover" />
                ) : (
                  <div className="w-full h-full rounded-3xl bg-light dark:bg-dark flex items-center justify-center">
                    <span className="font-display text-8xl text-accent/20">RCB</span>
                  </div>
                  
                )}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white">
                  <div className="text-center"><span className="text-3xl font-bold">100+</span><span className="block text-xs mt-1">Years of<br />Service</span></div>
                </div>
              </div>
            </div>
          </AnimatedSection>

        </div>
      </section>

      {/* Vision */}
      <section data-rota="vision" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection>
            <p className="text-accent font-semibold tracking-wider uppercase text-sm mb-4">Our Vision</p>
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-dark dark:text-white leading-tight mb-8">
              &ldquo;{content.visionText}&rdquo;
            </h2>
          </AnimatedSection>
        </div>
      </section>

      {/* Pillars + Stats */}
      <section data-rota="stats" className="py-20 px-6 md:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          <AnimatedSection>
            <h2 className="font-display text-4xl md:text-5xl text-dark dark:text-white mb-8">
              Our Pillars & Impact
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => {
              const Icon = statIcons[i % statIcons.length];
              return (
                <AnimatedSection key={i} delay={i * 100}>
                  <div className="text-center p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                    <Icon size={28} className="text-accent mx-auto mb-3" />
                    <p className="text-3xl font-bold text-dark dark:text-white mb-1">{stat.value}</p>
                    <p className="text-dark/50 dark:text-white/50 text-sm">{stat.label}</p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pillars.map((pillar, i) => {
              const Icon = iconMap[pillar.icon] || Heart;
              return (
                <AnimatedSection key={i} delay={i * 100}>
                  <div className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex gap-4 items-start">
                    <Icon size={24} className="text-accent flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-dark dark:text-white font-semibold mb-1">{pillar.title}</h3>
                      <p className="text-dark/60 dark:text-white/60 text-sm leading-relaxed">{pillar.description}</p>
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
