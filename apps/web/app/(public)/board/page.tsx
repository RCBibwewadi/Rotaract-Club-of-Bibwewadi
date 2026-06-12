'use client';

import { useState, useEffect } from 'react';
import AnimatedSection from '@/components/AnimatedSection';
import { FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { HiOutlineMail } from 'react-icons/hi';



interface BodMember {
  bod_id: string;
  full_name: string;
  designation: string;
  linkedin_url?: string;
  instagram_url?: string;
  gmail?: string;
  avatar_url?: string;
  description?: string;
  riy_year: string;
  is_current: boolean;
}

export default function BoardPage() {
  const [members, setMembers] = useState<BodMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/bod/current`);
        const data = await res.json();
        if (!cancelled) setMembers(data.data || []);
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const year = members[0]?.riy_year || '2025-26';

  return (
    <div className="min-h-screen transition-colors">
      {/* Hero */}
      <section data-rota="hero" className="min-h-[60vh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
        <div className="relative z-10 text-center px-6 max-w-4xl py-20">
          <AnimatedSection>
            <p className="text-accent font-semibold tracking-wider uppercase text-sm mb-4">
              Leadership
            </p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-dark dark:text-white mb-6">
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
            <h2 className="font-display text-3xl md:text-5xl text-dark dark:text-white mb-8">
              Board of Directors {year}
            </h2>
          </AnimatedSection>

          {loading && (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          )}

          {!loading && members.length === 0 && (
            <div className="text-center py-20">
              <p className="text-dark/40 dark:text-white/40 text-lg">No board members found.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member, i) => (
              <AnimatedSection key={member.bod_id} delay={i * 80}>
                <div className="group rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-accent/30 transition-all duration-300">
                  <div className="h-72 bg-gradient-to-br from-accent to-accent-light relative flex items-center justify-center">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover object-top" />
                    ) : (
                      <span className="text-white/30 font-display text-6xl">
                        {member.full_name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <p className="text-accent text-sm font-medium mb-1">{member.designation}</p>
                    <h3 className="text-dark dark:text-white text-xl font-semibold mb-2">{member.full_name}</h3>
                    {member.description && (
                      <p className="text-dark/50 dark:text-white/50 text-sm leading-relaxed mb-3">{member.description}</p>
                    )}
                    <div className="flex items-center gap-3">
                      {member.instagram_url && (
                        <a href={member.instagram_url} target="_blank" rel="noreferrer"
                          className="text-dark/30 dark:text-white/30 hover:text-accent transition-colors" title="Instagram">
                          <FaInstagram size={16} />
                        </a>
                      )}
                      {member.linkedin_url && (
                        <a href={member.linkedin_url} target="_blank" rel="noreferrer"
                          className="text-dark/30 dark:text-white/30 hover:text-accent transition-colors" title="LinkedIn">
                          <FaLinkedinIn size={16} />
                        </a>
                      )}
                      {member.gmail && (
                        <a href={`mailto:${member.gmail}`}
                          className="text-dark/30 dark:text-white/30 hover:text-accent transition-colors" title="Email">
                          <HiOutlineMail size={16} />
                        </a>
                      )}
                    </div>
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
