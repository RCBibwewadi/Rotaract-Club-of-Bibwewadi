'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useScrollY } from '@/hooks/useScrollY';
import AnimatedSection from '@/components/AnimatedSection';

const waveBars = Array.from({ length: 40 }, (_, i) => ({
  height: `${20 + Math.sin(i * 0.4) * 30 + Math.random() * 20}%`,
  animationDelay: `${i * 0.05}s`,
  animationDuration: `${0.8 + Math.random() * 0.8}s`,
}));

function WaveVisualizer() {
  return (
    <div className="flex items-end justify-center gap-[2px] h-20 opacity-40">
      {waveBars.map((bar, i) => (
        <div
          key={i}
          className="w-1 bg-gradient-to-t from-accent to-accent-light rounded-full wave-bar"
          style={bar}
        />
      ))}
    </div>
  );
}

function FloatingNote({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <div
      className="absolute text-accent/20 text-4xl font-display animate-pulse"
      style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s`, animationDuration: '3s' }}
    >
      ♪
    </div>
  );
}

export default function HomePage() {
  const { isDark, content, parallaxIntensity, fetchContent } = useStore();
  const scrollY = useScrollY();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  const notes = useMemo(() => [
    { delay: 0, x: 10, y: 20 }, { delay: 0.5, x: 85, y: 15 },
    { delay: 1, x: 70, y: 60 }, { delay: 1.5, x: 15, y: 70 },
    { delay: 2, x: 90, y: 80 }, { delay: 0.3, x: 50, y: 10 },
  ], []);

  const bgColor = isDark ? 'bg-dark' : 'bg-light';
  const textColor = isDark ? 'text-white' : 'text-dark';
  const mutedColor = isDark ? 'text-white/60' : 'text-dark/60';

  return (
    <div className={`${bgColor} ${textColor}`}>
      {/* Hero */}
      <section data-rota="home-hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ transform: `translateY(${scrollY * 0.2 * parallaxIntensity}px)` }}>
          <div className={`absolute inset-0 ${isDark ? 'bg-dark' : 'bg-light'}`} />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent-light/5 blur-3xl" />
          {notes.map((n, i) => <FloatingNote key={i} {...n} />)}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-40 opacity-20" style={{ transform: `translateY(${scrollY * -0.1 * parallaxIntensity}px)` }}>
          <svg viewBox="0 0 1200 200" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,100 Q150,20 300,100 T600,100 T900,100 T1200,100" fill="none" stroke="currentColor" strokeWidth="1" className="text-accent/30" />
            <path d="M0,120 Q150,40 300,120 T600,120 T900,120 T1200,120" fill="none" stroke="currentColor" strokeWidth="1" className="text-accent/20" />
            <path d="M0,140 Q150,60 300,140 T600,140 T900,140 T1200,140" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-accent/10" />
          </svg>
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <div className={`transition-all duration-1000 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <WaveVisualizer />
          </div>
          <h1 className={`font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9] mt-8 transition-all duration-1000 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {content.heroTitle}
            <span className="block gradient-text italic">{content.heroSubtitle}</span>
          </h1>
          <p className={`mt-8 text-lg md:text-xl ${mutedColor} max-w-xl mx-auto transition-all duration-1000 delay-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {content.heroTagline}
          </p>
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 transition-all duration-1000 delay-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Link href="/join" className="group px-8 py-4 bg-accent hover:bg-accent-light text-white rounded-full font-semibold text-sm tracking-wide transition-all duration-300 flex items-center gap-2">
              Join the Movement <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/about" className={`px-8 py-4 border rounded-full font-semibold text-sm tracking-wide transition-all duration-300 ${isDark ? 'border-white/20 hover:border-white/40 text-white' : 'border-dark/20 hover:border-dark/40 text-dark'}`}>
              Our Story
            </Link>
          </div>
        </div>

      </section>

      {/* Pillars */}
      <section data-rota="home-pillars" className={`py-24 md:py-32 relative ${isDark ? 'bg-dark-card' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="text-accent text-sm font-semibold uppercase tracking-[0.2em]">What We Stand For</span>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mt-4">
                Four Pillars of<br /><span className="italic gradient-text">Our Mission</span>
              </h2>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(content.pillars || []).map((pillar, i) => (
              <AnimatedSection key={i} delay={i * 150} from={i % 2 === 0 ? 'left' : 'right'}>
                <div className={`group relative p-8 md:p-10 rounded-2xl border transition-all duration-500 hover:scale-[1.02] ${isDark ? 'bg-dark-surface border-white/5 hover:border-accent/30' : 'bg-light-card border-black/5 hover:border-accent/30'} hover:shadow-xl hover:shadow-accent/5`}>
                  <div className="flex items-start gap-5">
                    <span className="text-4xl">{pillar.icon}</span>
                    <div>
                      <h3 className="font-display text-2xl md:text-3xl mb-3">{pillar.title}</h3>
                      <p className={`text-sm leading-relaxed ${mutedColor}`}>{pillar.description}</p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section data-rota="home-vision" className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-br from-accent/5 via-transparent to-accent-light/5">
        <div className="absolute inset-0 opacity-[0.03]" style={{ transform: `translateY(${scrollY * 0.15 * parallaxIntensity}px)` }}>
          <div className="absolute inset-0 bg-gradient-to-br from-accent via-transparent to-accent-light" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection from="scale">
            <div className="text-center">
              <span className="text-accent text-sm font-semibold uppercase tracking-[0.2em]">Our Vision</span>
              <blockquote className="font-display text-3xl sm:text-4xl md:text-5xl mt-6 leading-snug italic">
                &ldquo;{content.visionText}&rdquo;
              </blockquote>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Explore */}
      <section data-rota="home-explore" className={`py-24 md:py-32 ${isDark ? 'bg-dark-card' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <span className="text-accent text-sm font-semibold uppercase tracking-[0.2em]">Explore</span>
            <h2 className="font-display text-4xl sm:text-5xl mt-4">Dive <span className="italic gradient-text">Deeper</span></h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'FOMO', desc: 'Don\'t miss our best moments', href: '/projects', gradient: 'from-orange-500 to-red-500' },
              { title: 'Upcoming Events', desc: 'Join us at our next gathering', href: '/events', gradient: 'from-blue-500 to-purple-500' },
              { title: 'Meet the Board', desc: 'The leaders driving our mission', href: '/board', gradient: 'from-green-500 to-teal-500' },
            ].map((item, i) => (
              <AnimatedSection key={i} delay={i * 150} from={i === 0 ? 'left' : i === 2 ? 'right' : 'up'}>
                <Link href={item.href} className="group block relative overflow-hidden rounded-2xl aspect-[4/3]">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} transition-transform duration-700 group-hover:scale-110`} />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                  <div className="relative z-10 h-full flex flex-col justify-end p-8">
                    <h3 className="font-display text-3xl text-white">{item.title}</h3>
                    <p className="text-white/70 text-sm mt-2">{item.desc}</p>
                    <ArrowRight className="text-white mt-4 group-hover:translate-x-2 transition-transform" size={20} />
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section data-rota="home-cta" className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection from="scale">
            <div className={`text-center p-12 md:p-16 rounded-3xl border ${isDark ? 'bg-dark-surface border-white/5' : 'bg-white border-black/5'}`}>
              <span className="text-5xl">✨</span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mt-6">
                Ready to <span className="italic gradient-text">Create Change?</span>
              </h2>
              <p className={`mt-4 text-lg ${mutedColor} max-w-md mx-auto`}>
                Whether you&apos;re looking to serve, lead, or connect — your journey starts here.
              </p>
              <Link href="/join" className="inline-flex items-center gap-2 mt-8 px-10 py-4 bg-accent hover:bg-accent-light text-white rounded-full font-semibold transition-all duration-300">
                Become a Member <ArrowRight size={16} />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
