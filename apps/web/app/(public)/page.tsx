'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Handshake, HeartHandshake, Globe, Brain, Heart } from 'lucide-react';

const pillarIconMap: Record<string, React.ElementType> = {
  Handshake, HeartHandshake, Globe, Brain,
};
import { useStore } from '@/lib/store';
import { useScrollY } from '@/hooks/useScrollY';
import AnimatedSection from '@/components/AnimatedSection';

/* Rotary gear — barely visible, slowly spinning */
function GearMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none">
      <circle cx="100" cy="100" r="55" stroke="currentColor" strokeWidth="1.5" opacity="0.12" />
      <circle cx="100" cy="100" r="35" stroke="currentColor" strokeWidth="1" opacity="0.07" />
      <circle cx="100" cy="100" r="18" stroke="currentColor" strokeWidth="0.5" opacity="0.05" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return <circle key={i} cx={100 + Math.cos(a) * 55} cy={100 + Math.sin(a) * 55} r="4.5" fill="currentColor" opacity="0.09" />;
      })}
    </svg>
  );
}


/* Vertical connecting line between sections */
function Connector({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex justify-center py-1">
      <div className={`section-connector h-16 ${isDark ? 'text-white' : 'text-dark'}`} />
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

  const text = isDark ? 'text-white' : 'text-dark';
  const muted = isDark ? 'text-white/60' : 'text-dark/55';
  const faint = isDark ? 'text-white/40' : 'text-dark/35';

  return (
    <div className={`relative ${text}`}>
      {/* ═══════════════════════════════════════
          HERO — The motto introduces everything
          ═══════════════════════════════════════ */}
      <section data-rota="home-hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ transform: `translateY(${scrollY * 0.12 * parallaxIntensity}px)` }}>
          <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] rounded-full bg-accent/[0.04] blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-warm/[0.035] blur-[100px]" />
        </div>

        {/* Gear watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] slow-spin pointer-events-none">
          <GearMark className={`w-full h-full ${isDark ? 'text-white' : 'text-dark'}`} />
        </div>

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          {/* District badge */}
          <div className={`transition-all duration-1000 delay-100 ${loaded ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
            <span className={`inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase ${faint}`}>
              <span className="w-1 h-1 rounded-full bg-accent/60" />
              Rotaract · District 3131
            </span>
          </div>

          {/* Motto — the anchor of the whole page */}
          <h1 className={`mt-10 transition-all duration-1000 delay-300 ${loaded ? 'opacity-100' : 'opacity-0 translate-y-8'}`}>
            <span className={`block text-sm tracking-[0.3em] uppercase mb-6 ${muted}`}>
              Rotaract Club of Bibwewadi, Pune
            </span>
            <span className="block font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1] tracking-tight">
              Make it
            </span>
            <span className="block font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1] tracking-tight gradient-text mt-1">
              Matter.
            </span>
          </h1>

          <p className={`mt-10 text-[15px] md:text-base leading-relaxed ${muted} max-w-md mx-auto transition-all duration-1000 delay-500 ${loaded ? 'opacity-100' : 'opacity-0 translate-y-6'}`}>
            {content.heroTagline}
          </p>

          <div className={`flex items-center justify-center gap-4 mt-10 transition-all duration-1000 delay-700 ${loaded ? 'opacity-100' : 'opacity-0 translate-y-6'}`}>
            <Link href="/join" className="group px-7 py-3 bg-accent hover:bg-accent-light text-white rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2">
              Get Involved <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/about" className={`text-sm font-medium transition-colors ${isDark ? 'text-white/50 hover:text-white/70' : 'text-dark/45 hover:text-dark/70'}`}>
              Our Story →
            </Link>
          </div>
        </div>

        <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 ${faint}`}>
          <ChevronDown size={18} className="animate-bounce" />
        </div>
      </section>

      <Connector isDark={isDark} />

      {/* ═══════════════════════════════════════
          LEARN MORE — About Rotaract
          ═══════════════════════════════════════ */}
      <section className="py-16 md:py-20 text-center">
        <AnimatedSection>
          <p className={`text-sm md:text-base ${muted} max-w-md mx-auto mb-6`}>
            Curious about who we are and what drives us?
          </p>
          <Link href="/about" className="inline-flex items-center gap-2 px-7 py-3 bg-accent hover:bg-accent-light text-white rounded-full text-sm font-medium transition-all duration-300 group">
            Learn More About Rotaract <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </AnimatedSection>
      </section>

      <Connector isDark={isDark} />

      {/* ═══════════════════════════════════════
          IMPACT — Numbers that prove the motto
          ═══════════════════════════════════════ */}
      <section data-rota="home-pillars" className={`py-20 md:py-28 ${isDark ? 'bg-dark-card/80' : 'bg-white/80'} backdrop-blur-sm`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <p className={`text-center text-xs tracking-[0.2em] uppercase ${faint} mb-14`}>
              Making it <span className="matter-text text-accent">matter</span> — every day
            </p>
          </AnimatedSection>

          <div className="flex flex-wrap justify-evenly gap-y-10 mb-20">
            {(content.stats || []).map((s, i) => (
              <AnimatedSection key={i} delay={i * 100} from="scale">
                <div className="text-center px-4">
                  <p className="font-display text-3xl md:text-4xl tracking-tight">{s.value}</p>
                  <p className={`text-[11px] mt-2 ${muted} tracking-wide`}>{s.label}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <div className={`fade-rule ${isDark ? 'text-white' : 'text-dark'}`} />

          {/* Pillars — what makes the impact possible */}
          <AnimatedSection>
            <h2 className="text-center font-display text-3xl sm:text-4xl mt-20 mb-14 tracking-tight">
              What makes it <span className="matter-text text-accent">matter</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 rounded-2xl overflow-hidden">
            {(content.pillars || []).map((pillar, i) => (
              <AnimatedSection key={i} delay={i * 80}>
                <div className={`p-8 md:p-10 group transition-colors duration-500 ${isDark ? 'bg-dark-surface hover:bg-[#1f1f24]' : 'bg-light-card hover:bg-[#eeeee8]'}`}>
                  {(() => { const PIcon = pillarIconMap[pillar.icon] || Heart; return <PIcon size={28} className="text-accent block mb-4" />; })()}
                  <h3 className="text-lg font-semibold mb-2 tracking-tight">{pillar.title}</h3>
                  <p className={`text-sm leading-relaxed ${muted}`}>{pillar.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <Connector isDark={isDark} />

      {/* ═══════════════════════════════════════
          VISION — The deeper "why"
          ═══════════════════════════════════════ */}
      <section data-rota="home-vision" className="py-24 md:py-36 relative">
        <div className="absolute inset-0 opacity-[0.025]" style={{ transform: `translateY(${scrollY * 0.08 * parallaxIntensity}px)` }}>
          <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-b from-accent to-transparent' : 'bg-gradient-to-b from-accent/40 to-transparent'}`} />
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <div className="text-center">
              <p className={`text-[10px] tracking-[0.25em] uppercase ${faint} mb-10`}>Our vision</p>

              <blockquote className="font-display text-2xl sm:text-3xl md:text-[2.2rem] leading-[1.4] tracking-tight">
                {content.visionText}
              </blockquote>

              <div className={`mt-10 flex items-center justify-center gap-3 ${faint}`}>
                <div className="w-8 h-px bg-current" />
                <span className="text-[10px] tracking-[0.2em] uppercase">Make it matter</span>
                <div className="w-8 h-px bg-current" />
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Connector isDark={isDark} />

      {/* ═══════════════════════════════════════
          EXPLORE — Where the visitor goes next
          ═══════════════════════════════════════ */}
      <section data-rota="home-explore" className={`py-20 md:py-28 ${isDark ? 'bg-dark-card/80' : 'bg-white/80'} backdrop-blur-sm`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <p className={`text-xs tracking-[0.2em] uppercase ${faint} mb-12`}>Explore further</p>
          </AnimatedSection>

          <div className="space-y-0.5 rounded-2xl overflow-hidden">
            {[
              { title: 'FOMO', desc: 'Highlights from our events', path: '/projects', num: '01' },
              { title: 'Events', desc: 'Gatherings, workshops, and celebrations that bring us closer.', path: '/events', num: '02' },
              { title: 'Board', desc: 'The people who lead with empathy and act with purpose.', path: '/board', num: '03' },
            ].map((item, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <Link href={item.path} className={`group flex items-center justify-between p-6 md:p-8 transition-colors duration-400 ${isDark ? 'bg-dark-surface hover:bg-[#1f1f24]' : 'bg-light-card hover:bg-[#eeeee8]'}`}>
                  <div className="flex items-start gap-5">
                    <span className={`text-[10px] font-medium mt-1 ${faint}`}>{item.num}</span>
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight group-hover:text-accent transition-colors">{item.title}</h3>
                      <p className={`text-sm ${muted} mt-1`}>{item.desc}</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className={`flex-shrink-0 transition-all duration-300 ${isDark ? 'text-white/25 group-hover:text-accent group-hover:translate-x-1' : 'text-dark/20 group-hover:text-accent group-hover:translate-x-1'}`} />
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <Connector isDark={isDark} />

      {/* ═══════════════════════════════════════
          CTA — Tied back to the motto
          ═══════════════════════════════════════ */}
      <section data-rota="home-cta" className="py-28 md:py-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.15]">
                Your story can<br />
                <span className="matter-text text-accent">matter</span> too.
              </h2>

              <p className={`mt-6 text-[15px] leading-relaxed ${muted} max-w-sm mx-auto`}>
                Join a community that turns intention into impact — through service, fellowship, and shared growth.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
                <Link href="/join" className="px-8 py-3 bg-accent hover:bg-accent-light text-white rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2">
                  Begin Here <ArrowRight size={14} />
                </Link>
                <Link href="/contact" className={`text-sm font-medium transition-colors ${isDark ? 'text-white/45 hover:text-white/70' : 'text-dark/40 hover:text-dark/65'}`}>
                  Have questions? →
                </Link>
              </div>

              {/* Closing motto mark */}
              <p className={`mt-16 text-[10px] tracking-[0.25em] uppercase ${faint}`}>
                Make it matter 
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

    </div>
  );
}
