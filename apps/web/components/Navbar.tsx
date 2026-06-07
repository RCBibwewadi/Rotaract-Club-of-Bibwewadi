'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sun, Moon, Shield } from 'lucide-react';
import { useStore } from '@/lib/store';

const navLinks = [
  { label: 'Home', path: '/', num: '01' },
  { label: 'About', path: '/about', num: '02' },
  { label: 'Projects', path: '/projects', num: '03' },
  { label: 'Events', path: '/events', num: '04' },
  { label: 'Board', path: '/board', num: '05' },
  { label: 'Join Us', path: '/join', num: '06' },
  { label: 'Contact', path: '/contact', num: '07' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggleDark } = useStore();

  // Scroll tracking
  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 40);
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docH > 0 ? Math.min(1, window.scrollY / docH) : 0);
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Apply dark class to html
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Close menu on route change
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setMenuOpen(false);
    }
  }, [pathname]);

  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleNavClick = (path: string) => {
    setMenuOpen(false);
    if (path !== pathname) {
      router.push(path);
    }
  };

  const bg = scrolled
    ? isDark
      ? 'bg-dark/80 backdrop-blur-2xl border-b border-white/5'
      : 'bg-white/80 backdrop-blur-2xl border-b border-black/5'
    : 'bg-transparent';

  return (
    <>
      {/* Top bar */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${bg}`}>
        {/* Scroll progress bar */}
        <div className="absolute bottom-0 left-0 h-[2px] bg-accent/80 transition-none" style={{ width: `${scrollProgress * 100}%` }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group relative z-[110]">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
                RC
              </div>
              <div className="hidden sm:block">
                <span className={`font-display text-lg leading-tight transition-colors ${menuOpen ? 'text-white' : isDark ? 'text-white' : 'text-dark'}`}>
                  Rotaract
                </span>
                <span className={`block text-[10px] tracking-[0.2em] uppercase leading-none transition-colors ${menuOpen ? 'text-white/50' : isDark ? 'text-white/50' : 'text-dark/50'}`}>
                  Bibwewadi Pune
                </span>
              </div>
            </Link>

            {/* Desktop inline links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                    pathname === link.path
                      ? 'text-accent bg-accent/10'
                      : isDark
                        ? 'text-white/70 hover:text-white hover:bg-white/5'
                        : 'text-dark/70 hover:text-dark hover:bg-dark/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 relative z-[110]">
              <button
                onClick={toggleDark}
                className={`p-2 rounded-lg transition-all ${menuOpen ? 'text-white/70 hover:text-white' : isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-dark/70 hover:text-dark hover:bg-dark/10'}`}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <Link
                href="/admin"
                className={`p-2 rounded-lg transition-all ${menuOpen ? 'text-white/70 hover:text-accent' : isDark ? 'text-white/70 hover:text-accent hover:bg-white/10' : 'text-dark/70 hover:text-accent hover:bg-dark/10'}`}
                aria-label="Admin"
              >
                <Shield size={18} />
              </Link>

              {/* Hamburger */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`p-2 rounded-lg transition-all ${menuOpen ? 'text-white' : isDark ? 'text-white' : 'text-dark'}`}
                aria-label="Menu"
              >
                <div className="w-6 h-5 flex flex-col justify-between relative">
                  <span
                    className={`block h-0.5 rounded-full transition-all duration-500 origin-center ${menuOpen ? 'bg-white rotate-45 translate-y-[9px]' : isDark ? 'bg-white' : 'bg-dark'}`}
                  />
                  <span
                    className={`block h-0.5 rounded-full transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : isDark ? 'bg-white opacity-100' : 'bg-dark opacity-100'}`}
                  />
                  <span
                    className={`block h-0.5 rounded-full transition-all duration-500 origin-center ${menuOpen ? 'bg-white -rotate-45 -translate-y-[9px]' : isDark ? 'bg-white' : 'bg-dark'}`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Full-screen immersive menu overlay */}
      <div
        className={`fixed inset-0 z-[90] transition-all duration-700 ${
          menuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Background */}
        <div
          className={`absolute inset-0 bg-dark transition-all duration-700 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Accent blob */}
        <div
          className={`absolute top-1/4 -right-20 w-[500px] h-[500px] rounded-full bg-accent/10 blur-[120px] transition-all duration-1000 ${
            menuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
        />

        {/* Navigation links */}
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 w-full">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12">
              {/* Links */}
              <nav className="flex-1">
                <ul className="space-y-2 md:space-y-4">
                  {navLinks.map((link, i) => {
                    const isActive = pathname === link.path;
                    const isHovered = hoveredIdx === i;
                    const isFaded = hoveredIdx !== null && !isHovered;

                    return (
                      <li
                        key={link.path}
                        className={`transition-all duration-700 ${menuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
                        style={{ transitionDelay: menuOpen ? `${150 + i * 60}ms` : '0ms' }}
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                      >
                        <button
                          onClick={() => handleNavClick(link.path)}
                          className={`group flex items-center gap-4 md:gap-6 transition-all duration-300 ${isFaded ? 'opacity-30' : 'opacity-100'}`}
                        >
                          <span className={`text-xs font-mono transition-colors ${isActive ? 'text-accent' : 'text-white/30'}`}>
                            {link.num}
                          </span>
                          <span
                            className={`font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl transition-all duration-300 ${
                              isActive
                                ? 'text-accent'
                                : isHovered
                                  ? 'text-white translate-x-3'
                                  : 'text-white/80'
                            }`}
                          >
                            {link.label}
                          </span>
                          {/* Active indicator */}
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                          )}
                          {/* Hover arrow */}
                          <span
                            className={`text-accent font-display text-2xl transition-all duration-300 ${
                              isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                            }`}
                          >
                            →
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Side info */}
              <div
                className={`hidden lg:flex flex-col gap-8 max-w-xs transition-all duration-700 ${
                  menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: menuOpen ? '500ms' : '0ms' }}
              >
                <div>
                  <span className="text-white/30 text-xs uppercase tracking-[0.2em]">Part of</span>
                  <p className="text-white/60 text-sm mt-1">Rotary International District 3131</p>
                </div>
                <div>
                  <span className="text-white/30 text-xs uppercase tracking-[0.2em]">Follow us</span>
                  <div className="flex gap-3 mt-2">
                    {['IG', 'FB', 'IN'].map(s => (
                      <div key={s} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-accent hover:border-accent transition-all text-xs font-medium cursor-pointer">
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-auto">
                  <p className="text-white/20 text-xs">&copy; {new Date().getFullYear()} RCB Pune</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
