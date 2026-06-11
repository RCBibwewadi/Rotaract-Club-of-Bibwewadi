'use client';

import { useState, useEffect } from 'react';
import { Mail, ExternalLink, Play } from 'lucide-react';
import AnimatedSection from '@/components/AnimatedSection';



interface BodMember {
  bod_id: string;
  full_name: string;
  designation: string;
  linkedin_url?: string;
  instagram_url?: string;
  gmail?: string;
  avatar_url?: string;
}

interface LegacyYear {
  legacy_id: string;
  riy_year: string;
  year_video_url?: string;
  bod_members: BodMember[];
}

function isVideoFile(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const id = u.hostname.includes('youtu.be')
        ? u.pathname.slice(1)
        : u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return null;
  } catch { return null; }
}

export default function LegacyPage() {
  const [years, setYears] = useState<LegacyYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/legacy`);
        const data = await res.json();
        if (!cancelled) setYears(data.data || []);
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen transition-colors">
      {/* Hero */}
      <section data-rota="hero" className="min-h-[60vh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
        <div className="relative z-10 text-center px-6 max-w-4xl py-20">
          <AnimatedSection>
            <p className="text-accent font-semibold tracking-wider uppercase text-sm mb-4">
              Our Journey
            </p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-dark dark:text-white mb-6">
              The <span className="gradient-text">Legacy</span>
            </h1>
            <p className="text-dark/60 dark:text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
              Celebrating the leaders who shaped our club across the years.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-6 md:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          {loading && (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          )}

          {!loading && years.length === 0 && (
            <div className="text-center py-20">
              <p className="text-dark/40 dark:text-white/40 text-lg">No legacy records yet.</p>
            </div>
          )}

          <div className="space-y-24">
            {years.map((year, yi) => {
              const videoUrl = year.year_video_url || '';
              const ytEmbed = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;
              const isDirectVideo = videoUrl ? isVideoFile(videoUrl) : false;

              return (
                <AnimatedSection key={year.legacy_id} delay={yi * 100}>
                  <div>
                    {/* Year header */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white font-bold text-xl">
                        {year.riy_year.slice(0, 4)}
                      </div>
                      <div>
                        <h2 className="font-display text-3xl md:text-4xl text-dark dark:text-white">
                          RIY {year.riy_year}
                        </h2>
                        <p className="text-dark/40 dark:text-white/40 text-sm">Board of Directors</p>
                      </div>
                    </div>

                    {/* Video showcase */}
                    {videoUrl && (
                      <div className="mb-10">
                        {isDirectVideo ? (
                          <video
                            src={videoUrl}
                            controls
                            className="w-full aspect-video rounded-2xl bg-black object-contain"
                          />
                        ) : activeVideo === year.riy_year && ytEmbed ? (
                          <div className="aspect-video rounded-2xl overflow-hidden bg-black">
                            <iframe
                              src={ytEmbed}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={`RIY ${year.riy_year} Video`}
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => setActiveVideo(year.riy_year)}
                            className="w-full aspect-video rounded-2xl bg-gradient-to-br from-dark-surface to-dark-card border border-white/10 hover:border-accent/30 transition-all flex items-center justify-center group cursor-pointer"
                          >
                            <div className="w-16 h-16 rounded-full bg-accent/20 group-hover:bg-accent/30 flex items-center justify-center transition-colors">
                              <Play size={28} className="text-accent ml-1" />
                            </div>
                          </button>
                        )}
                      </div>
                    )}

                    {/* BOD cards */}
                    {year.bod_members.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {year.bod_members.map(member => (
                          <div key={member.bod_id}
                            className="rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-5 hover:border-accent/20 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                              {member.avatar_url ? (
                                <img src={member.avatar_url} alt={member.full_name}
                                  className="w-10 h-10 rounded-xl object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/60 to-accent-light flex items-center justify-center text-white text-sm font-bold">
                                  {member.full_name.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="text-dark dark:text-white font-medium text-sm truncate">{member.full_name}</h4>
                                <p className="text-accent text-xs">{member.designation}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {member.instagram_url && (
                                <a href={member.instagram_url} target="_blank" rel="noreferrer"
                                  className="text-dark/20 dark:text-white/20 hover:text-accent transition-colors">
                                  <ExternalLink size={14} />
                                </a>
                              )}
                              {member.linkedin_url && (
                                <a href={member.linkedin_url} target="_blank" rel="noreferrer"
                                  className="text-dark/20 dark:text-white/20 hover:text-accent transition-colors">
                                  <ExternalLink size={14} />
                                </a>
                              )}
                              {member.gmail && (
                                <a href={`mailto:${member.gmail}`}
                                  className="text-dark/20 dark:text-white/20 hover:text-accent transition-colors">
                                  <Mail size={14} />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-dark/30 dark:text-white/30 text-sm">No BOD members recorded for this year.</p>
                    )}
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
