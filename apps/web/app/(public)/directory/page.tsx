'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import AnimatedSection from '@/components/AnimatedSection';
import MembersGate from '@/components/MembersGate';
import { useAuthStore } from '@/lib/auth-store';
import {
  Users, Briefcase, GraduationCap, BookOpen, Search, MapPin, Globe,
  X, Mail, Phone, MessageCircle, EyeOff, ArrowRight, Handshake,
} from 'lucide-react';



type Tab = 'members' | 'business' | 'professions' | 'students';

interface DirectoryMember {
  member_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  member_type: string;
  years_in_rcb?: number;
  college_name?: string;
  course?: string;
  businesses?: DirectoryBusiness[];
  professions?: DirectoryProfession[];
  member_visibility?: DirectoryVisibility | DirectoryVisibility[];
}

/** Supabase returns object for 1-to-1, array for 1-to-many — normalize */
function getVis(v?: DirectoryVisibility | DirectoryVisibility[]): DirectoryVisibility | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

interface DirectoryBusiness {
  business_id: string;
  business_name: string;
  industry?: string;
  designation?: string;
  description?: string;
  website_url?: string;
  business_city?: string;
  members?: { member_id: string; full_name: string; email?: string; phone?: string; avatar_url?: string; member_visibility?: DirectoryVisibility | DirectoryVisibility[] };
}

interface DirectoryProfession {
  profession_id: string;
  profession_type: string;
  specialisation?: string;
  years_experience?: string;
  employer?: string;
  is_primary: boolean;
  members?: { member_id: string; full_name: string; email?: string; phone?: string; avatar_url?: string; member_visibility?: DirectoryVisibility | DirectoryVisibility[] };
}

interface DirectoryVisibility {
  show_business_name: boolean;
  show_contact: boolean;
  show_profession: boolean;
  open_to_collab: boolean;
}

interface ConnectTarget {
  full_name: string;
  avatar_url?: string;
  profession_type?: string;
  employer?: string;
  email?: string;
  phone?: string;
  show_contact?: boolean;
}

interface PreviewMember {
  member_id: string;
  full_name: string;
  avatar_url?: string;
  member_type: string;
}

export default function DirectoryPage() {
  const { token, member, _hydrated } = useAuthStore();
  const [tab, setTab] = useState<Tab>('members');
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [businesses, setBusinesses] = useState<DirectoryBusiness[]>([]);
  const [professions, setProfessions] = useState<DirectoryProfession[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectModal, setConnectModal] = useState<ConnectTarget | null>(null);
  const [expandedDesc, setExpandedDesc] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Preview state (for unauthenticated users)
  const [previewMembers, setPreviewMembers] = useState<PreviewMember[]>([]);
  const [previewCounts, setPreviewCounts] = useState({ members: 0, businesses: 0 });

  const isAuthenticated = !!token;

  // Infinite scroll — load 6 more when sentinel enters viewport
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisibleCount(prev => prev + 6);
    }, { threshold: 0.1 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [tab, search, loading]);

  // Fetch preview data for unauthenticated visitors
  useEffect(() => {
    if (!_hydrated || isAuthenticated) return;
    fetch('/api/directory/preview')
      .then(r => r.json())
      .then(res => {
        setPreviewMembers(res.data?.members || []);
        setPreviewCounts(res.data?.counts || { members: 0, businesses: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [_hydrated, isAuthenticated]);

  // Fetch full data for authenticated users
  useEffect(() => {
    if (!token) return;
    setLoading(true);

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`/api/members`, { headers }).then(r => r.json()),
      fetch(`/api/businesses`, { headers }).then(r => r.json()),
      fetch(`/api/professions`, { headers }).then(r => r.json()),
    ])
      .then(([m, b, p]) => {
        setMembers(m.data || []);
        setBusinesses(b.data || []);
        setProfessions(p.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const changeTab = (t: Tab) => { setTab(t); setSearch(''); setVisibleCount(6); };


  // Filtered data
  const students = useMemo(() => members.filter(m => m.member_type.toLowerCase().includes('student')), [members]);

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter(m =>
      m.full_name.toLowerCase().includes(q) ||
      m.member_type.toLowerCase().includes(q)
    );
  }, [members, search]);

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter(s =>
      s.full_name.toLowerCase().includes(q) ||
      (s.college_name || '').toLowerCase().includes(q) ||
      (s.course || '').toLowerCase().includes(q)
    );
  }, [students, search]);

  const filteredBusinesses = useMemo(() => {
    const q = search.toLowerCase();
    return businesses.filter(b =>
      b.business_name.toLowerCase().includes(q) ||
      (b.industry || '').toLowerCase().includes(q) ||
      (b.description || '').toLowerCase().includes(q)
    );
  }, [businesses, search]);

  const filteredProfessions = useMemo(() => {
    const q = search.toLowerCase();
    return professions.filter(p =>
      p.profession_type.toLowerCase().includes(q) ||
      (p.specialisation || '').toLowerCase().includes(q) ||
      (p.employer || '').toLowerCase().includes(q)
    );
  }, [professions, search]);

  if (!_hydrated) return null;

  // ─── UNAUTHENTICATED: Gate view ────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen transition-colors">
        {/* Hero (simplified for visitors) */}
        <section className="relative overflow-hidden pt-28 pb-12 px-6">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent-light/5" />
          <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-accent/5 blur-[100px]" />
          <div className="relative z-10 max-w-7xl mx-auto">
            <AnimatedSection>
              <p className="text-accent font-semibold tracking-wider uppercase text-sm mb-3">Our Network</p>
              <h1 className="font-display text-5xl md:text-7xl text-dark dark:text-white mb-4">
                Member <span className="gradient-text italic">Directory</span>
              </h1>
              <p className="text-dark/50 dark:text-white/50 text-lg max-w-2xl">
                Connect with fellow Rotaractors — explore businesses, professions, and grow together.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* Gate + blurred preview grid */}
        <section className="px-6 pb-20">
          <div className="max-w-7xl mx-auto relative">
            {/* Gate overlay — desktop: absolute over grid, mobile: relative flow */}
            <div className="
              relative min-[761px]:absolute min-[761px]:inset-x-0 min-[761px]:top-8
              flex justify-center
              z-20 mb-8 min-[761px]:mb-0
            ">
              <MembersGate
                memberCount={previewCounts.members}
                businessCount={previewCounts.businesses}
              />
            </div>

            {/* Blurred preview cards */}
            <div
              className="
                min-[761px]:relative
                max-[760px]:absolute max-[760px]:inset-x-0 max-[760px]:top-0
              "
              aria-hidden="true"
              style={{
                filter: 'blur(7px) saturate(.85) brightness(.7)',
                pointerEvents: 'none',
                userSelect: 'none',
                maskImage: 'linear-gradient(180deg,#000 0%,#000 42%,transparent 88%)',
                WebkitMaskImage: 'linear-gradient(180deg,#000 0%,#000 42%,transparent 88%)',
              }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" tabIndex={-1}>
                {previewMembers.map((m) => {
                  const initials = m.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <div key={m.member_id} className="p-5 rounded-2xl bg-light-card dark:bg-dark-card border border-black/5 dark:border-white/5">
                      <div className="flex items-center gap-3 mb-3">
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-dark dark:text-white font-semibold truncate">{m.full_name}</h3>
                          <p className="text-dark/50 dark:text-white/50 text-sm capitalize">{m.member_type.split(',').join(', ')}</p>
                        </div>
                      </div>
                      <div className="w-full py-2.5 rounded-xl bg-accent/10 text-accent font-medium text-sm text-center">
                        Connect
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ─── AUTHENTICATED: Full directory ─────────────────────────────────
  const firstName = member?.full_name?.split(' ')[0] || 'Member';
  const memberInitials = member?.full_name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'M';

  const tabs: { key: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { key: 'members', label: 'Members', icon: Users, count: members.length },
    { key: 'business', label: 'Business', icon: Briefcase, count: businesses.length },
    { key: 'professions', label: 'Professions', icon: GraduationCap, count: professions.length },
    { key: 'students', label: 'Students', icon: BookOpen, count: students.length },
  ];

  return (
    <div className="min-h-screen transition-colors">
      {/* Hero */}
      <section data-rota="members-hero" className="relative overflow-hidden pt-28 pb-12 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent-light/5" />
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-accent/5 blur-[100px]" />
        <div className="relative z-10 max-w-7xl mx-auto">
          <AnimatedSection>
            <p className="text-accent font-semibold tracking-wider uppercase text-sm mb-3">Our Network</p>
            <h1 className="font-display text-5xl md:text-7xl text-dark dark:text-white mb-4">
              Member <span className="gradient-text italic">Directory</span>
            </h1>
            <p className="text-dark/50 dark:text-white/50 text-lg max-w-2xl mb-6">
              with fellow Rotaractors — explore businesses, professions, and grow together.
            </p>
            <div className="flex items-center gap-3">
              {member?.avatar_url ? (
                <img src={member.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-sm font-bold">
                  {memberInitials}
                </div>
              )}
              <span className="text-dark/60 dark:text-white/60 text-sm">
                Welcome back, <span className="text-dark dark:text-white font-medium">{firstName}</span>
              </span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Directory */}
      <section data-rota="members-dir" className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Tab Bar */}
          <div className="flex gap-1 p-1.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 mb-6 overflow-x-auto">
            {tabs.map(t => (
              <button key={t.key} onClick={() => changeTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all flex-1 justify-center whitespace-nowrap ${
                  tab === t.key
                    ? 'bg-accent text-white shadow-md'
                    : 'text-dark/50 dark:text-white/50 hover:text-dark dark:hover:text-white'
                }`}>
                <t.icon size={16} />
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full max-[760px]:hidden ${
                  tab === t.key ? 'bg-white/20' : 'bg-black/5 dark:bg-white/10'
                }`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30 dark:text-white/30" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setVisibleCount(6); }}
              placeholder="Search members, businesses, professions..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-dark dark:text-white placeholder-dark/30 dark:placeholder-white/30 focus:border-accent focus:outline-none transition-colors"
            />
          </div>


          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          )}

          {/* Members Tab */}
          {!loading && tab === 'members' && (
            filteredMembers.length === 0 ? <EmptyState /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMembers.slice(0, visibleCount).map((m, i) => {
                  const initials = m.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  const vis = getVis(m.member_visibility);
                  const primaryProf = m.professions?.find(p => p.is_primary) || m.professions?.[0];

                  return (
                    <AnimatedSection key={m.member_id} delay={i * 60}>
                      <div className="p-5 rounded-2xl bg-light-card dark:bg-dark-card border border-black/5 dark:border-white/5 hover:scale-[1.02] hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-3">
                          {m.avatar_url ? (
                            <img src={m.avatar_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="text-dark dark:text-white font-semibold truncate">{m.full_name}</h3>
                            {m.years_in_rcb !== undefined && m.years_in_rcb > 0 && (
                              <p className="text-dark/30 dark:text-white/30 text-xs">Since {new Date().getFullYear() - m.years_in_rcb}</p>
                            )}
                          </div>
                        </div>
                        {m.member_type.includes('student') && m.college_name ? (
                          <p className="text-dark/50 dark:text-white/50 text-sm mb-1">
                            {m.college_name}{m.course ? ` — ${m.course}` : ''}
                          </p>
                        ) : (
                          <p className="text-dark/50 dark:text-white/50 text-sm mb-1 capitalize">
                            {m.member_type.split(',').join(', ')}
                          </p>
                        )}
                        {vis?.open_to_collab && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-accent/10 text-accent font-medium mb-2">
                            <Handshake size={12} /> Open to Collab
                          </span>
                        )}
                        <div className="mt-auto pt-3">
                          <button onClick={() => {
                            const canShowContact = vis?.show_contact || vis?.open_to_collab;
                            setConnectModal({
                              full_name: m.full_name,
                              avatar_url: m.avatar_url,
                              profession_type: primaryProf?.profession_type,
                              employer: primaryProf?.employer,
                              show_contact: canShowContact,
                              email: canShowContact ? m.email : undefined,
                              phone: canShowContact ? m.phone : undefined,
                            });
                          }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent/10 text-accent font-medium text-sm hover:bg-accent/20 transition-colors">
                            Connect <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </AnimatedSection>
                  );
                })}
              </div>
            )
          )}

          {/* Business Tab */}
          {!loading && tab === 'business' && (
            filteredBusinesses.length === 0 ? <EmptyState /> : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filteredBusinesses.slice(0, visibleCount).map((b, i) => {
                  const ownerName = b.members?.full_name || 'Unknown';
                  const ownerAvatar = b.members?.avatar_url;
                  const ownerInitials = ownerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  const isExpanded = expandedDesc === b.business_id;
                  const isLongDesc = (b.description || '').length > 100;

                  return (
                    <AnimatedSection key={b.business_id} delay={i * 80} from={i % 2 === 0 ? 'left' : 'right'}>
                      <div className="rounded-2xl bg-light-card dark:bg-dark-card border border-black/5 dark:border-white/5 overflow-hidden hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 flex flex-col h-full">
                        {/* Gradient header */}
                        <div className="h-24 bg-gradient-to-r from-accent to-accent-light relative flex-shrink-0">
                          <div className="absolute inset-0 bg-black/20" />
                          {b.industry && (
                            <span className="absolute bottom-3 left-4 px-3 py-1 text-xs bg-black/30 backdrop-blur-sm text-white rounded-full">
                              {b.industry}
                            </span>
                          )}
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-display text-dark dark:text-white text-xl">{b.business_name}</h3>
                              <p className="text-dark/40 dark:text-white/40 text-sm">by {ownerName}</p>
                            </div>
                            {ownerAvatar ? (
                              <img src={ownerAvatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {ownerInitials}
                              </div>
                            )}
                          </div>
                          {b.description && (
                            <div className="mb-3">
                              <div className={`text-dark/50 dark:text-white/50 text-sm ${isExpanded ? 'max-h-32 overflow-y-auto' : 'line-clamp-2'}`}>
                                {b.description}
                              </div>
                              {isLongDesc && (
                                <button onClick={() => setExpandedDesc(isExpanded ? null : b.business_id)}
                                  className="text-accent text-xs font-medium mt-1 hover:underline">
                                  {isExpanded ? 'Show less' : 'Show more'}
                                </button>
                              )}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {b.business_city && (
                              <span className="flex items-center gap-1 text-xs text-dark/40 dark:text-white/40 px-2 py-1 rounded-full bg-black/5 dark:bg-white/5">
                                <MapPin size={12} /> {b.business_city}
                              </span>
                            )}
                            {b.website_url && (
                              <a href={b.website_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-dark/40 dark:text-white/40 px-2 py-1 rounded-full bg-black/5 dark:bg-white/5 hover:text-accent transition-colors">
                                <Globe size={12} /> Website
                              </a>
                            )}
                          </div>
                          <div className="mt-auto">
                            <button onClick={() => {
                              const vis = getVis(b.members?.member_visibility);
                              const canShow = vis?.show_contact || vis?.open_to_collab;
                              setConnectModal({
                                full_name: ownerName,
                                avatar_url: ownerAvatar,
                                profession_type: b.designation,
                                employer: b.business_name,
                                show_contact: canShow,
                                email: canShow ? b.members?.email : undefined,
                                phone: canShow ? b.members?.phone : undefined,
                              });
                            }}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-light transition-colors">
                              Connect <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </AnimatedSection>
                  );
                })}
              </div>
            )
          )}

          {/* Professions Tab */}
          {!loading && tab === 'professions' && (
            filteredProfessions.length === 0 ? <EmptyState /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProfessions.slice(0, visibleCount).map((p, i) => {
                  const ownerName = p.members?.full_name || 'Unknown';
                  const ownerAvatar = p.members?.avatar_url;
                  const ownerInitials = ownerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  const tags = [p.specialisation, p.employer].filter(Boolean);

                  return (
                    <AnimatedSection key={p.profession_id} delay={i * 60}>
                      <div className="p-5 rounded-2xl bg-light-card dark:bg-dark-card border border-black/5 dark:border-white/5 hover:scale-[1.02] hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-3">
                          {ownerAvatar ? (
                            <img src={ownerAvatar} alt="" className="w-12 h-12 rounded-xl object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {ownerInitials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="text-dark dark:text-white font-semibold truncate">{ownerName}</h3>
                            <p className="text-accent font-medium text-sm">{p.profession_type}</p>
                          </div>
                        </div>
                        {p.employer && (
                          <p className="text-dark/50 dark:text-white/50 text-sm flex items-center gap-1.5 mb-1">
                            <Briefcase size={13} className="flex-shrink-0" /> {p.employer}
                          </p>
                        )}
                        {p.years_experience && (
                          <p className="text-dark/40 dark:text-white/40 text-xs flex items-center gap-1.5 mb-3">
                            <GraduationCap size={13} className="flex-shrink-0" />
                            {p.specialisation && `${p.specialisation} · `}{p.years_experience} experience
                          </p>
                        )}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {tags.map((t, j) => (
                              <span key={j} className="px-2.5 py-1 text-xs rounded-full bg-accent/10 text-accent">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-auto pt-3">
                          <button onClick={() => {
                            const vis = getVis(p.members?.member_visibility);
                            const canShow = vis?.show_contact || vis?.open_to_collab;
                            setConnectModal({
                              full_name: ownerName,
                              avatar_url: ownerAvatar,
                              profession_type: p.profession_type,
                              employer: p.employer,
                              show_contact: canShow,
                              email: canShow ? p.members?.email : undefined,
                              phone: canShow ? p.members?.phone : undefined,
                            });
                          }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent/10 text-accent font-medium text-sm hover:bg-accent/20 transition-colors">
                            Connect <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </AnimatedSection>
                  );
                })}
              </div>
            )
          )}
          {/* Students Tab */}
          {!loading && tab === 'students' && (
            filteredStudents.length === 0 ? <EmptyState /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStudents.slice(0, visibleCount).map((s, i) => {
                  const initials = s.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  const vis = getVis(s.member_visibility);

                  return (
                    <AnimatedSection key={s.member_id} delay={i * 60}>
                      <div className="p-5 rounded-2xl bg-light-card dark:bg-dark-card border border-black/5 dark:border-white/5 hover:scale-[1.02] hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-3">
                          {s.avatar_url ? (
                            <img src={s.avatar_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="text-dark dark:text-white font-semibold truncate">{s.full_name}</h3>
                            {s.years_in_rcb !== undefined && s.years_in_rcb > 0 && (
                              <p className="text-dark/30 dark:text-white/30 text-xs">Since {new Date().getFullYear() - s.years_in_rcb}</p>
                            )}
                          </div>
                        </div>
                        {s.college_name && (
                          <p className="text-dark/50 dark:text-white/50 text-sm flex items-center gap-1.5 mb-1">
                            <BookOpen size={13} className="flex-shrink-0" /> {s.college_name}
                          </p>
                        )}
                        {s.course && (
                          <p className="text-dark/40 dark:text-white/40 text-xs flex items-center gap-1.5 mb-3">
                            <GraduationCap size={13} className="flex-shrink-0" /> {s.course}
                          </p>
                        )}
                        {vis?.open_to_collab && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-accent/10 text-accent font-medium mb-2 w-fit">
                            <Handshake size={12} /> Open to Collab
                          </span>
                        )}
                        <div className="mt-auto pt-3">
                          <button onClick={() => {
                            const canShowContact = vis?.show_contact || vis?.open_to_collab;
                            setConnectModal({
                              full_name: s.full_name,
                              avatar_url: s.avatar_url,
                              show_contact: canShowContact,
                              email: canShowContact ? s.email : undefined,
                              phone: canShowContact ? s.phone : undefined,
                            });
                          }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent/10 text-accent font-medium text-sm hover:bg-accent/20 transition-colors">
                            Connect <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </AnimatedSection>
                  );
                })}
              </div>
            )
          )}

          {/* Load more sentinel */}
          {!loading && (
            (tab === 'members' && visibleCount < filteredMembers.length) ||
            (tab === 'business' && visibleCount < filteredBusinesses.length) ||
            (tab === 'professions' && visibleCount < filteredProfessions.length) ||
            (tab === 'students' && visibleCount < filteredStudents.length)
          ) && (
            <div ref={loadMoreRef} className="flex justify-center py-8">
              <div className="h-6 w-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </section>

      {/* Connect Modal */}
      {connectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          onClick={() => setConnectModal(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-3xl bg-light-card dark:bg-dark-card border border-black/10 dark:border-white/10 p-6 rota-pop"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setConnectModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-dark/40 dark:text-white/40 hover:text-dark dark:hover:text-white transition-colors">
              <X size={20} />
            </button>

            <div className="text-center mb-5">
              {connectModal.avatar_url ? (
                <img src={connectModal.avatar_url} alt="" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                  {connectModal.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <h3 className="text-dark dark:text-white text-xl font-semibold">{connectModal.full_name}</h3>
              {connectModal.profession_type && (
                <p className="text-dark/50 dark:text-white/50 text-sm">
                  {connectModal.profession_type}{connectModal.employer ? ` @ ${connectModal.employer}` : ''}
                </p>
              )}
            </div>

            <div className="border-t border-black/10 dark:border-white/10 pt-4">
              <p className="text-dark/40 dark:text-white/40 text-xs text-center uppercase tracking-wider mb-4">
                Ways to connect
              </p>

              {connectModal.show_contact === false ? (
                <div className="text-center py-6">
                  <EyeOff size={32} className="text-dark/20 dark:text-white/20 mx-auto mb-2" />
                  <p className="text-dark/40 dark:text-white/40 text-sm">
                    This member hasn&apos;t shared contact details yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {connectModal.email && (
                    <a href={`mailto:${connectModal.email}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-black/5 dark:border-white/5 hover:border-accent/40 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Mail size={18} className="text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-dark/40 dark:text-white/40 text-xs">Email</p>
                        <p className="text-dark dark:text-white text-sm truncate">{connectModal.email}</p>
                      </div>
                      <ArrowRight size={14} className="text-dark/20 dark:text-white/20" />
                    </a>
                  )}
                  {connectModal.phone && (
                    <>
                      <a href={`tel:${connectModal.phone}`}
                        className="flex items-center gap-3 p-3 rounded-xl border border-black/5 dark:border-white/5 hover:border-accent/40 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                          <Phone size={18} className="text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-dark/40 dark:text-white/40 text-xs">Phone</p>
                          <p className="text-dark dark:text-white text-sm">{connectModal.phone}</p>
                        </div>
                        <ArrowRight size={14} className="text-dark/20 dark:text-white/20" />
                      </a>
                      <a href={`https://wa.me/${connectModal.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-black/5 dark:border-white/5 hover:border-accent/40 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                          <MessageCircle size={18} className="text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-dark/40 dark:text-white/40 text-xs">WhatsApp</p>
                          <p className="text-dark dark:text-white text-sm">{connectModal.phone}</p>
                        </div>
                        <ArrowRight size={14} className="text-dark/20 dark:text-white/20" />
                      </a>
                    </>
                  )}
                  {!connectModal.email && !connectModal.phone && (
                    <div className="text-center py-6">
                      <EyeOff size={32} className="text-dark/20 dark:text-white/20 mx-auto mb-2" />
                      <p className="text-dark/40 dark:text-white/40 text-sm">
                        This member hasn&apos;t shared contact details yet.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <Search size={40} className="text-dark/10 dark:text-white/10 mx-auto mb-3" />
      <p className="text-dark/40 dark:text-white/40 font-medium">No results found.</p>
      <p className="text-dark/30 dark:text-white/30 text-sm">Try a different search.</p>
    </div>
  );
}
