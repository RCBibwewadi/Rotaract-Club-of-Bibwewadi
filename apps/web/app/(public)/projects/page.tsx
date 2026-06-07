'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import AnimatedSection from '@/components/AnimatedSection';
import { Calendar, Tag } from 'lucide-react';

export default function ProjectsPage() {
  const projects = useStore((s) => s.content.projects);
  const [activeFilter, setActiveFilter] = useState('All');

  const categories = ['All', ...Array.from(new Set(projects.map((p) => p.category)))];
  const filtered = activeFilter === 'All' ? projects : projects.filter((p) => p.category === activeFilter);

  return (
    <div className="min-h-screen bg-light dark:bg-dark transition-colors">
      {/* Hero */}
      <section data-rota="hero" className="min-h-[60vh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
        <div className="relative z-10 text-center px-6 max-w-4xl py-20">
          <AnimatedSection>
            <p className="text-accent font-semibold tracking-wider uppercase text-sm mb-4">Our Work</p>
            <h1 className="font-[Instrument_Serif] text-5xl md:text-7xl lg:text-8xl text-dark dark:text-white mb-6">
              <span className="gradient-text">Projects</span>
            </h1>
            <p className="text-dark/60 dark:text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
              Creating lasting impact through meaningful community initiatives.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Filter + Gallery */}
      <section data-rota="projects" className="py-20 px-6 md:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          {/* Filters */}
          <AnimatedSection>
            <div className="flex flex-wrap gap-3 mb-8">
              {categories.map((cat) => (
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

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((project, i) => (
              <AnimatedSection key={project.id} delay={i * 80}>
                <div className="group rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-accent/30 transition-all duration-300">
                  <div className={`h-40 bg-gradient-to-br ${project.gradient} relative`}>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute bottom-3 left-3 flex gap-2">
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 text-white text-xs">
                        <Tag size={12} />
                        {project.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-dark dark:text-white font-semibold text-lg mb-2">{project.title}</h3>
                    <p className="text-dark/50 dark:text-white/50 text-sm leading-relaxed mb-3">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-1 text-dark/30 dark:text-white/30 text-xs">
                      <Calendar size={12} />
                      {new Date(project.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
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
