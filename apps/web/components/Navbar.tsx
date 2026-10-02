'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Sun, Moon, User, LogOut, ChevronDown, Lock } from 'lucide-react';
import { FaInstagram, FaLinkedinIn, FaFacebookF } from 'react-icons/fa';
import { useStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import ReelTheVibeRegisterModal from './ReelTheVibeRegisterModal';

interface NavItem {
  label: string;
  path?: string;
  num: string;
  children?: { label: string; path: string }[];
  requiresAuth?: boolean;
}

const navStructure: NavItem[] = [
  {
    label: 'Home',
    num: '01',
    children: [
      { label: 'About', path: '/about' },
      { label: 'Board', path: '/board' },
      { label: 'Legacy', path: '/legacy' },
    ],
  },
  {
    label: 'Up Next',
    num: '02',
    children: [
      { label: 'FOMO', path: '/projects' },
      { label: 'Events', path: '/events' },
    ],
  },
  {
    label: 'Contact Us',
    num: '03',
    children: [
      { label: 'Contact', path: '/contact' },
      { label: 'Join Us', path: '/join' },
    ],
  },
  {
    label: 'Exclusive',
    num: '04',
    requiresAuth: true,
    children: [
      { label: 'Directory', path: '/directory' },
    ],
  },
];

// Phase-aware children for Reel the Vibe (built dynamically)
function getReelTheVibeChildren(phase: string): { label: string; path: string }[] {
  const items: { label: string; path: string }[] = [];

  if (phase === 'registration') {
    items.push({ label: 'Register', path: '__register__' });
  }

  if (phase === 'revealed' || phase === 'voting') {
    items.push({ label: 'Leaderboard', path: '/leaderboard' });
    items.push({ label: 'Team', path: '/team-revel' });
  }

  if (phase === 'voting') {
    items.push({ label: 'Voting', path: '/voting' });
  }

  return items;
}

// Easter egg: memberships are closed, so /join is now a notice page. Tapping
// "Join Us" ten times inside fifteen seconds opens the real registration form.
const SECRET_JOIN_PATH = '/join/tereliyeopenhai';
const SECRET_TAPS = 10;
const SECRET_WINDOW_MS = 15_000;

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [reelPhase, setReelPhase] = useState('registration');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openSubDropdown, setOpenSubDropdown] = useState<string | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [expandedMobileSub, setExpandedMobileSub] = useState<string | null>(null);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggleDark } = useStore();
  const { token, member, logout } = useAuthStore();
  const isLoggedIn = token !== null;
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subDropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const memberInitials = member?.full_name
    ?.split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '';

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push('/');
  };

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

  // Fetch reel phase
  useEffect(() => {
    fetch('/api/reel-the-vibe/state')
      .then(r => r.json())
      .then(d => { if (d.data?.phase) setReelPhase(d.data.phase); })
      .catch(() => {});
  }, []);

  const reelTheVibeChildren = getReelTheVibeChildren(reelPhase);

  // Build full nav with dynamic Reel the Vibe
  const fullNavStructure: NavItem[] = [
    ...navStructure,
    ...(reelTheVibeChildren.length > 0 ? [{
      label: 'Reel the Vibe',
      num: '05',
      children: reelTheVibeChildren,
    }] : []),
  ];

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
      setOpenDropdown(null);
      setOpenSubDropdown(null);
    }
  }, [pathname]);

  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Easter egg tap counter
  const joinTaps = useRef<number[]>([]);
  const registerJoinTap = (): boolean => {
    const now = Date.now();
    joinTaps.current = [...joinTaps.current, now].filter(t => now - t < SECRET_WINDOW_MS);
    if (joinTaps.current.length < SECRET_TAPS) return false;
    joinTaps.current = [];
    setMenuOpen(false);
    router.push(SECRET_JOIN_PATH);
    return true;
  };

  const handleNavClick = (path: string) => {
    if (path === '/join') {
      if (registerJoinTap()) return;
      if (pathname === '/join') return;
    }
    setMenuOpen(false);
    setOpenDropdown(null);
    setOpenSubDropdown(null);
    if (path !== pathname) {
      router.push(path);
    }
  };

  const handleDropdownEnter = useCallback((label: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setOpenDropdown(label);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
      setOpenSubDropdown(null);
    }, 150);
  }, []);

  const handleSubDropdownEnter = useCallback((label: string) => {
    if (subDropdownTimeoutRef.current) clearTimeout(subDropdownTimeoutRef.current);
    setOpenSubDropdown(label);
  }, []);

  const handleSubDropdownLeave = useCallback(() => {
    subDropdownTimeoutRef.current = setTimeout(() => {
      setOpenSubDropdown(null);
    }, 150);
  }, []);

  const isChildActive = (item: NavItem) => {
    return item.children?.some(c => pathname === c.path) || false;
  };

  const isTeamRevel = pathname === '/team-revel';

  // On /team-revel: always visible but transparent, solid bg only near footer
  const teamRevelAtFooter = isTeamRevel && scrollProgress > 0.85;

  const bg = isTeamRevel
    ? teamRevelAtFooter
      ? isDark
        ? 'bg-dark/80 backdrop-blur-2xl border-b border-white/5'
        : 'bg-white/80 backdrop-blur-2xl border-b border-black/5'
      : 'bg-transparent'
    : scrolled
      ? isDark
        ? 'bg-dark/80 backdrop-blur-2xl border-b border-white/5'
        : 'bg-white/80 backdrop-blur-2xl border-b border-black/5'
      : 'bg-transparent';

  return (
    <>
      {/* Top bar */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${bg}`}>
        {/* Scroll progress bar */}
        {!isTeamRevel && (
          <div className="absolute bottom-0 left-0 h-[2px] bg-accent/80 transition-none" style={{ width: `${scrollProgress * 100}%` }} />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 md:h-24">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1 group relative z-[110]">
              <Image src="/logo.png" alt="RCB Logo" width={92} height={92} />
              <div className="hidden sm:block">
                <span className={`text-base font-medium tracking-tight leading-tight transition-colors ${menuOpen ? 'text-white/90' : isDark ? 'text-white/90' : 'text-dark/90'}`}>
                  Rotaract
                </span>
                <span className={`block text-[10px] tracking-[0.15em] uppercase leading-none transition-colors ${menuOpen ? 'text-white/35' : isDark ? 'text-white/35' : 'text-dark/35'}`}>
                  BIBWEWADI · PUNE
                </span>
              </div>
            </Link>

            {/* Desktop dropdown links */}
            <div className="hidden lg:flex items-center gap-1">
              {fullNavStructure.map((item) => {
                const isLocked = item.requiresAuth && !isLoggedIn;
                const isOpen = openDropdown === item.label;
                const active = isChildActive(item);

                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => !isLocked && handleDropdownEnter(item.label)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <button
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                        active
                          ? 'text-accent bg-accent/10'
                          : isLocked
                            ? isDark ? 'text-white/30 cursor-not-allowed' : 'text-dark/30 cursor-not-allowed'
                            : isDark
                              ? 'text-white/60 hover:text-white/90 hover:bg-white/5'
                              : 'text-dark/60 hover:text-dark/90 hover:bg-dark/5'
                      }`}
                      onClick={() => {
                        if (isLocked) {
                          router.push('/login');
                          return;
                        }
                        setOpenDropdown(isOpen ? null : item.label);
                      }}
                    >
                      {isLocked && <Lock size={14} />}
                      {item.label}
                      <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown menu */}
                    {isOpen && !isLocked && (
                      <div className={`absolute top-full left-0 mt-1 min-w-[180px] rounded-xl border shadow-xl py-1.5 ${
                        isDark
                          ? 'bg-dark/95 backdrop-blur-xl border-white/10'
                          : 'bg-white/95 backdrop-blur-xl border-black/10'
                      }`}>
                        {item.children?.map((child) => {
                          const isReelTheVibe = child.label === 'Reel the Vibe';
                          const isSubOpen = openSubDropdown === child.label;

                          if (isReelTheVibe) {
                            return (
                              <div
                                key={child.path}
                                className="relative"
                                onMouseEnter={() => handleSubDropdownEnter(child.label)}
                                onMouseLeave={handleSubDropdownLeave}
                              >
                                <button
                                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all duration-200 ${
                                    pathname === child.path || reelTheVibeChildren.some(r => pathname === r.path)
                                      ? 'text-accent bg-accent/10'
                                      : isDark
                                        ? 'text-white/70 hover:text-white hover:bg-white/5'
                                        : 'text-dark/70 hover:text-dark hover:bg-dark/5'
                                  }`}
                                >
                                  {child.label}
                                  <ChevronDown size={12} className={`transition-transform duration-200 -rotate-90 ${isSubOpen ? '!rotate-0' : ''}`} />
                                </button>

                                {isSubOpen && (
                                  <div className={`absolute left-full top-0 ml-1 min-w-[160px] rounded-xl border shadow-xl py-1.5 ${
                                    isDark
                                      ? 'bg-dark/95 backdrop-blur-xl border-white/10'
                                      : 'bg-white/95 backdrop-blur-xl border-black/10'
                                  }`}>
                                    {reelTheVibeChildren.map((sub) =>
                                      sub.path === '__register__' ? (
                                        <button
                                          key={sub.path}
                                          onClick={() => {
                                            setOpenDropdown(null);
                                            setOpenSubDropdown(null);
                                            setRegisterModalOpen(true);
                                          }}
                                          className={`block w-full text-left px-4 py-2.5 text-sm font-semibold transition-all duration-200 text-accent hover:bg-accent/10`}
                                        >
                                          {sub.label}
                                        </button>
                                      ) : (
                                        <Link
                                          key={sub.path}
                                          href={sub.path}
                                          className={`block px-4 py-2.5 text-sm transition-all duration-200 ${
                                            pathname === sub.path
                                              ? 'text-accent bg-accent/10'
                                              : isDark
                                                ? 'text-white/70 hover:text-white hover:bg-white/5'
                                                : 'text-dark/70 hover:text-dark hover:bg-dark/5'
                                          }`}
                                        >
                                          {sub.label}
                                        </Link>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          if (child.path === '__register__') {
                            return (
                              <button
                                key={child.path}
                                onClick={() => {
                                  setOpenDropdown(null);
                                  setRegisterModalOpen(true);
                                }}
                                className="block w-full text-left px-4 py-2.5 text-sm font-semibold transition-all duration-200 text-accent hover:bg-accent/10"
                              >
                                {child.label}
                              </button>
                            );
                          }

                          return (
                            <Link
                              key={child.path}
                              href={child.path}
                              onClick={(e) => {
                                if (child.path === '/join') {
                                  if (pathname === '/join') e.preventDefault();
                                  registerJoinTap();
                                }
                              }}
                              className={`block px-4 py-2.5 text-sm transition-all duration-200 ${
                                pathname === child.path
                                  ? 'text-accent bg-accent/10'
                                  : isDark
                                    ? 'text-white/70 hover:text-white hover:bg-white/5'
                                    : 'text-dark/70 hover:text-dark hover:bg-dark/5'
                              }`}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3 relative z-[110]">
              <button
                onClick={toggleDark}
                className={`p-2.5 rounded-lg transition-all ${menuOpen ? 'text-white/70 hover:text-white' : isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-dark/70 hover:text-dark hover:bg-dark/10'}`}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={22} /> : <Moon size={22} />}
              </button>

              {isLoggedIn ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 relative z-[110]"
                  aria-label="Profile"
                >
                  {member?.avatar_url ? (
                    <img src={member.avatar_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-accent/30" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-sm font-bold">
                      {memberInitials}
                    </div>
                  )}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className={`p-2 rounded-lg transition-all ${menuOpen ? 'text-white/70 hover:text-accent' : isDark ? 'text-white/70 hover:text-accent hover:bg-white/10' : 'text-dark/70 hover:text-accent hover:bg-dark/10'}`}
                  aria-label="Login"
                >
                  <User size={22} />
                </Link>
              )}

              {/* Hamburger */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`p-2 rounded-lg transition-all ${menuOpen ? 'text-white' : isDark ? 'text-white' : 'text-dark'}`}
                aria-label="Menu"
              >
                <div className="w-7 h-6 flex flex-col justify-between relative">
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
        <div className="relative z-10 h-full overflow-y-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 w-full min-h-full flex items-center">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12 w-full">
              {/* Links */}
              <nav className="flex-1">
                <ul className="space-y-1 sm:space-y-2 md:space-y-3">
                  {/* Home link */}
                  <li
                    className={`transition-all duration-700 ${menuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
                    style={{ transitionDelay: menuOpen ? '150ms' : '0ms' }}
                  >
                    <button
                      onClick={() => handleNavClick('/')}
                      className={`group flex items-center gap-4 md:gap-6 transition-all duration-300`}
                    >
                      <span className={`text-xs font-mono transition-colors ${pathname === '/' ? 'text-accent' : 'text-white/40'}`}>
                        00
                      </span>
                      <span className={`font-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl transition-all duration-300 ${
                        pathname === '/' ? 'text-accent' : 'text-white/70 hover:text-white hover:translate-x-3'
                      }`}>
                        Home
                      </span>
                      {pathname === '/' && <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />}
                    </button>
                  </li>

                  {fullNavStructure.map((item, i) => {
                    const isExpanded = expandedMobile === item.label;
                    const isLocked = item.requiresAuth && !isLoggedIn;
                    const active = isChildActive(item);

                    return (
                      <li
                        key={item.label}
                        className={`transition-all duration-700 ${menuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
                        style={{ transitionDelay: menuOpen ? `${210 + i * 60}ms` : '0ms' }}
                      >
                        <button
                          onClick={() => {
                            if (isLocked) {
                              handleNavClick('/login');
                              return;
                            }
                            setExpandedMobile(isExpanded ? null : item.label);
                            setExpandedMobileSub(null);
                          }}
                          className={`group flex items-center gap-4 md:gap-6 transition-all duration-300 ${isLocked ? 'opacity-40' : ''}`}
                        >
                          <span className={`text-xs font-mono transition-colors ${active ? 'text-accent' : 'text-white/40'}`}>
                            {item.num}
                          </span>
                          <span className={`font-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl transition-all duration-300 ${
                            active ? 'text-accent' : 'text-white/70'
                          }`}>
                            {item.label}
                          </span>
                          {isLocked && <Lock size={20} className="text-white/30" />}
                          <ChevronDown size={24} className={`text-white/40 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Mobile submenu */}
                        <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                          <div className="pl-12 md:pl-16 space-y-1">
                            {item.children?.map((child) => {
                              const isReelTheVibe = child.label === 'Reel the Vibe';
                              const isSubExpanded = expandedMobileSub === child.label;

                              if (isReelTheVibe) {
                                return (
                                  <div key={child.path}>
                                    <button
                                      onClick={() => setExpandedMobileSub(isSubExpanded ? null : child.label)}
                                      className={`flex items-center gap-3 py-2 text-lg sm:text-xl md:text-2xl transition-all duration-300 ${
                                        pathname === child.path || reelTheVibeChildren.some(r => pathname === r.path)
                                          ? 'text-accent'
                                          : 'text-white/50 hover:text-white/80'
                                      }`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                      {child.label}
                                      <ChevronDown size={16} className={`text-white/30 transition-transform duration-300 ${isSubExpanded ? 'rotate-180' : ''}`} />
                                    </button>

                                    <div className={`overflow-hidden transition-all duration-400 ${isSubExpanded ? 'max-h-[200px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                      <div className="pl-8 space-y-1">
                                        {reelTheVibeChildren.map((sub) => (
                                          <button
                                            key={sub.path}
                                            onClick={() => {
                                              if (sub.path === '__register__') {
                                                setMenuOpen(false);
                                                setRegisterModalOpen(true);
                                              } else {
                                                handleNavClick(sub.path);
                                              }
                                            }}
                                            className={`flex items-center gap-3 py-1.5 text-base sm:text-lg transition-all duration-300 ${
                                              sub.path === '__register__'
                                                ? 'text-accent font-semibold'
                                                : pathname === sub.path ? 'text-accent' : 'text-white/40 hover:text-white/70'
                                            }`}
                                          >
                                            <span className="w-1 h-1 rounded-full bg-white/15" />
                                            {sub.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <button
                                  key={child.path}
                                  onClick={() => {
                                    if (child.path === '__register__') {
                                      setMenuOpen(false);
                                      setRegisterModalOpen(true);
                                    } else {
                                      handleNavClick(child.path);
                                    }
                                  }}
                                  className={`flex items-center gap-3 py-2 text-lg sm:text-xl md:text-2xl transition-all duration-300 ${
                                    child.path === '__register__'
                                      ? 'text-accent font-semibold'
                                      : pathname === child.path ? 'text-accent' : 'text-white/50 hover:text-white/80'
                                  }`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                  {child.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Logged-in user section in overlay */}
                {isLoggedIn && (
                  <div
                    className={`mt-6 pt-4 border-t border-white/10 flex items-center gap-4 transition-all duration-700 ${
                      menuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                    }`}
                    style={{ transitionDelay: menuOpen ? `${150 + (fullNavStructure.length + 1) * 60}ms` : '0ms' }}
                  >
                    <Link href="/profile" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 text-white/60 hover:text-white transition-colors">
                      {member?.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-sm font-bold">
                          {memberInitials}
                        </div>
                      )}
                      <span className="text-sm">{member?.full_name || 'Profile'}</span>
                    </Link>
                    <button onClick={handleLogout}
                      className="ml-auto flex items-center gap-2 text-white/30 hover:text-red-400 transition-colors text-sm">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </nav>

              {/* Side info */}
              <div
                className={`hidden lg:flex flex-col gap-8 max-w-xs transition-all duration-700 ${
                  menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: menuOpen ? '500ms' : '0ms' }}
              >
                <div>
                  <span className="text-white/40 text-xs uppercase tracking-[0.2em]">Part of</span>
                  <p className="text-white/65 text-sm mt-1">Rotary International District 3131</p>
                </div>
                <div>
                  <span className="text-white/40 text-xs uppercase tracking-[0.2em]">Follow us</span>
                  <div className="flex gap-3 mt-2">
                    {[
                      { icon: FaInstagram, label: 'Instagram' },
                      { icon: FaFacebookF, label: 'Facebook' },
                      { icon: FaLinkedinIn, label: 'LinkedIn' },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-accent hover:border-accent transition-all cursor-pointer">
                        <Icon size={16} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-auto">
                  <p className="text-white/30 text-xs">&copy; {new Date().getFullYear()} RCB Pune</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reel the Vibe Registration Modal */}
      <ReelTheVibeRegisterModal
        open={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
      />
    </>
  );
}
