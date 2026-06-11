'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Site-wide ambient background layer.
 *
 * Fixed full-viewport, pointer-events: none, z-0.
 * Persists across route changes (mounted in public layout).
 *
 * Layers (bottom → top):
 *   1. Slow-drifting cranberry + gold aurora blobs (CSS keyframes)
 *   2. Slowly rotating Rotaract wheel motif (SVG, 180s spin)
 *   3. Faint film-grain noise overlay (inline SVG texture, 3% opacity)
 *
 * Mouse parallax on desktop shifts blob positions subtly.
 * prefers-reduced-motion → static gradient, no animation.
 * Pauses CSS animations via will-change cleanup when tab hidden.
 */

export default function BackgroundAmbient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const blobLayerRef = useRef<HTMLDivElement>(null);
  const rafId = useRef(0);
  const mouseX = useRef(0.5);
  const mouseY = useRef(0.5);
  const currentX = useRef(0.5);
  const currentY = useRef(0.5);

  // Smooth mouse-follow for blob parallax (desktop only)
  const animate = useCallback(() => {
    // Lerp toward target
    currentX.current += (mouseX.current - currentX.current) * 0.02;
    currentY.current += (mouseY.current - currentY.current) * 0.02;

    if (blobLayerRef.current) {
      const dx = (currentX.current - 0.5) * 30; // max ±15px
      const dy = (currentY.current - 0.5) * 20; // max ±10px
      blobLayerRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    }

    rafId.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    // Skip mouse tracking on touch / small screens
    const mq = window.matchMedia('(pointer: fine) and (min-width: 768px)');
    if (!mq.matches) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReduced.matches) return;

    const onMove = (e: MouseEvent) => {
      mouseX.current = e.clientX / window.innerWidth;
      mouseY.current = e.clientY / window.innerHeight;
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    rafId.current = requestAnimationFrame(animate);

    // Pause when tab hidden
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId.current);
      } else {
        rafId.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
      cancelAnimationFrame(rafId.current);
    };
  }, [animate]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden ambient-root"
      aria-hidden="true"
    >
      {/* ── Layer 0: Base fill (replaces body bg) ── */}
      <div className="absolute inset-0 bg-light dark:bg-dark transition-colors duration-300" />

      {/* ── Layer 1: Aurora blobs ── */}
      <div ref={blobLayerRef} className="absolute inset-0 ambient-blobs">
        {/* Primary cranberry glow — top-left drift */}
        <div className="ambient-blob ambient-blob-1" />
        {/* Secondary cranberry glow — bottom-right drift */}
        <div className="ambient-blob ambient-blob-2" />
        {/* Gold accent glow — center drift */}
        <div className="ambient-blob ambient-blob-3" />
        {/* Faint warm fill — slow breathe */}
        <div className="ambient-blob ambient-blob-4" />
      </div>

      {/* ── Layer 2: Rotaract wheel motif ── */}
      <div className="absolute inset-0 flex items-center justify-center ambient-wheel-container">
        <svg
          viewBox="0 0 800 800"
          fill="none"
          className="w-[min(90vw,800px)] h-[min(90vw,800px)] ambient-wheel"
        >
          {/* Outer ring */}
          <circle cx="400" cy="400" r="350" stroke="currentColor" strokeWidth="0.4" />
          <circle cx="400" cy="400" r="320" stroke="currentColor" strokeWidth="0.2" strokeDasharray="4 12" />

          {/* Inner rings — Rotaract gear suggestion */}
          <circle cx="400" cy="400" r="220" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="400" cy="400" r="200" stroke="currentColor" strokeWidth="0.3" />
          <circle cx="400" cy="400" r="120" stroke="currentColor" strokeWidth="0.4" />

          {/* Gear teeth — 12 spokes radiating outward (Rotaract wheel nod) */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 400 + Math.cos(angle) * 130;
            const y1 = 400 + Math.sin(angle) * 130;
            const x2 = 400 + Math.cos(angle) * 210;
            const y2 = 400 + Math.sin(angle) * 210;
            return (
              <line
                key={`spoke-${i}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="currentColor"
                strokeWidth="0.3"
              />
            );
          })}

          {/* Outer gear teeth — short ticks at 24 positions */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15 * Math.PI) / 180;
            const x1 = 400 + Math.cos(angle) * 340;
            const y1 = 400 + Math.sin(angle) * 340;
            const x2 = 400 + Math.cos(angle) * 355;
            const y2 = 400 + Math.sin(angle) * 355;
            return (
              <line
                key={`tick-${i}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="currentColor"
                strokeWidth="0.5"
              />
            );
          })}

          {/* Center dot cluster */}
          <circle cx="400" cy="400" r="8" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="400" cy="400" r="3" fill="currentColor" opacity="0.4" />

          {/* Scattered orbital dots */}
          {[
            [180, 140], [620, 120], [680, 380], [600, 620], [160, 600],
            [100, 360], [400, 70], [700, 520], [90, 520], [440, 700],
            [280, 90], [650, 200], [520, 660], [140, 440], [400, 730],
            [320, 160], [560, 140], [660, 460], [140, 280], [500, 80],
          ].map(([cx, cy], i) => (
            <circle key={`dot-${i}`} cx={cx} cy={cy} r="1.5" fill="currentColor" opacity={0.3 + (i % 5) * 0.1} />
          ))}
        </svg>
      </div>

      {/* ── Layer 3: Film grain noise ── */}
      <div className="absolute inset-0 ambient-grain" />
    </div>
  );
}
