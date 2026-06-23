'use client';

import { useState, useEffect } from 'react';
import { Tag, X, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import AnimatedSection from '@/components/AnimatedSection';



interface FomoItem {
  fomo_id: string;
  category: string;
  name: string;
  description?: string;
  thumbnail?: string;
  images?: string[];
  videos?: string[];
  events?: { event_id: string; event_name: string; event_date?: string; event_avenue?: string } | null;
}

export default function FomoPage() {
  const [items, setItems] = useState<FomoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [lightbox, setLightbox] = useState<{ urls: string[]; idx: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/fomo`);
        const data = await res.json();
        if (!cancelled) setItems(data.data || []);
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const categories = ['All', 'Good Times', 'Meaningful Moments', 'The Journey', 'Proud Moments'];
  const filtered = activeFilter === 'All' ? items : items.filter(f => f.category === activeFilter);

  const openLightbox = (urls: string[], idx: number) => setLightbox({ urls, idx });
  const closeLightbox = () => setLightbox(null);
  const prevSlide = () => lightbox && setLightbox({ ...lightbox, idx: (lightbox.idx - 1 + lightbox.urls.length) % lightbox.urls.length });
  const nextSlide = () => lightbox && setLightbox({ ...lightbox, idx: (lightbox.idx + 1) % lightbox.urls.length });

  function isVideo(url: string) {
    return /\.(mp4|webm|mov)(\?|$)/i.test(url);
  }

  return (
    <div className="min-h-screen transition-colors">
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center" onClick={closeLightbox}>
          <button onClick={closeLightbox} className="absolute top-4 right-4 text-white/70 hover:text-white z-10"><X size={28} /></button>
          {lightbox.urls.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prevSlide(); }} className="absolute left-4 text-white/70 hover:text-white z-10"><ChevronLeft size={32} /></button>
              <button onClick={e => { e.stopPropagation(); nextSlide(); }} className="absolute right-4 text-white/70 hover:text-white z-10"><ChevronRight size={32} /></button>
            </>
          )}
          <div className="max-w-5xl max-h-[90vh] w-full mx-4" onClick={e => e.stopPropagation()}>
            {isVideo(lightbox.urls[lightbox.idx]) ? (
              <video src={lightbox.urls[lightbox.idx]} controls autoPlay className="w-full max-h-[85vh] object-contain rounded-xl" />
            ) : (
              <img src={lightbox.urls[lightbox.idx]} alt="" className="w-full max-h-[85vh] object-contain rounded-xl" />
            )}
            {lightbox.urls.length > 1 && (
              <p className="text-center text-white/50 text-sm mt-2">{lightbox.idx + 1} / {lightbox.urls.length}</p>
            )}
          </div>
        </div>
      )}

      {/* Hero */}
      <section data-rota="hero" className="min-h-[60vh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
        <div className="relative z-10 text-center px-6 max-w-4xl py-20">
          <AnimatedSection>
            <p className="text-accent font-semibold tracking-wider uppercase text-sm mb-4">Don&apos;t Miss Out</p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-dark dark:text-white mb-6">
              <span className="gradient-text">FOMO</span>
            </h1>
            <p className="text-dark/60 dark:text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
              Highlights from our events — photos, videos, and unforgettable moments.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Filter + Gallery */}
      <section data-rota="fomo" className="py-20 px-6 md:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          {/* Filters */}
          <AnimatedSection>
            <div className="flex flex-wrap gap-3 mb-8">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeFilter === cat
                      ? 'bg-accent text-white'
                      : 'bg-black/5 dark:bg-white/5 text-dark/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </AnimatedSection>

          {loading && (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-dark/40 dark:text-white/40 text-lg">No FOMO posts yet.</p>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((fomo, i) => {
              const allMedia = [...(fomo.images || []), ...(fomo.videos || [])];
              const thumb = fomo.thumbnail || fomo.images?.[0] || null;

              return (
                <AnimatedSection key={fomo.fomo_id} delay={i * 80}>
                  <div className="group rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-accent/30 transition-all duration-300 flex flex-col h-full">
                    {/* Thumbnail */}
                    <div
                      className="h-52 relative cursor-pointer bg-gradient-to-br from-accent/20 to-accent-light/20 flex-shrink-0"
                      onClick={() => allMedia.length > 0 && openLightbox(allMedia, 0)}
                    >
                      {thumb ? (
                        <img src={thumb} alt={fomo.name} className="w-full h-full object-cover" />
                      ) : fomo.videos?.[0] ? (
                        <div className="w-full h-full flex items-center justify-center bg-black/30">
                          <Play size={36} className="text-white/50" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/30 to-accent-light/30">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
                            <span className="text-white font-bold text-xl">RC</span>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                      <div className="absolute bottom-3 left-3 flex gap-2">
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 text-white text-xs">
                          <Tag size={12} /> {fomo.category}
                        </span>
                        {allMedia.length > 1 && (
                          <span className="px-2 py-1 rounded-full bg-black/40 text-white text-xs">
                            {allMedia.length} items
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-5 flex flex-col flex-1 min-h-0">
                      <h3
                        className="text-dark dark:text-white font-semibold text-lg mb-1 cursor-pointer hover:text-accent transition-colors"
                        onClick={() => allMedia.length > 0 && openLightbox(allMedia, 0)}
                      >
                        {fomo.name}
                      </h3>
                      {fomo.events?.event_name && (
                        <p className="text-accent text-xs mb-2">{fomo.events.event_name}</p>
                      )}
                      {fomo.description && (
                        <p className="text-dark/50 dark:text-white/50 text-sm leading-relaxed flex-1 overflow-y-auto max-h-24">{fomo.description}</p>
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
