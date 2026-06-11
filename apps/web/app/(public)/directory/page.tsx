'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';
import { useAuthStore } from '@/lib/auth-store';
import {
  Lock, Users, Briefcase, GraduationCap, Search, MapPin, Globe,
  X, Mail, Phone, MessageCircle, EyeOff, ArrowRight,
} from 'lucide-react';



type Tab = 'members' | 'business' | 'professions';

interface DirectoryMember {
  member_id: string;
  full_name: string;
  avatar_url?: string;
  member_type: string;
  years_in_rcb?: number;
  businesses?: DirectoryBusiness[];
  professions?: DirectoryProfession[];
  member_visibility?: DirectoryVisibility[];
}

interface DirectoryBusiness {
  business_id: string;
  business_name: string;
  industry?: string;
  designation?: string;
  description?: string;
  website_url?: string;
  business_city?: string;
  members?: { member_id: string; full_name: string; avatar_url?: string };
}

interface DirectoryProfession {
  profession_id: string;
  profession_type: string;
  specialisation?: string;
  years_experience?: string;
  employer?: string;
  is_primary: boolean;
  members?: { member_id: string; full_name: string; avatar_url?: string };
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

export default function DirectoryPage() {
  const { token, member, _hydrated } = useAuthStore();
  const [tab, setTab] = useState<Tab>('members');
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState('All');
  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [businesses, setBusinesses] = useState<DirectoryBusiness[]>([]);
  const [professions, setProfessions] = useState<DirectoryProfession[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectModal, setConnectModal] = useState<ConnectTarget | null>(null);

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

  // Reset chip on tab change
  useEffect(() => { setActiveChip('All'); setSearch(''); }, [tab]);

  // Filter chips
  const businessChips = useMemo(() => {
    const industries = businesses.map(b => b.industry).filter(Boolean) as string[];
    return ['All', ...Array.from(new Set(industries))];
  }, [businesses]);

  const professionChips = useMemo(() => {
    const types = professions.map(p => p.profession_type).filter(Boolean) as string[];
    return ['All', ...Array.from(new Set(types))];
  }, [professions]);

  // Filtered data
  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter(m =>
      m.full_name.toLowerCase().includes(q) ||
      m.member_type.toLowerCase().includes(q)
    );
  }, [members, search]);

  const filteredBusinesses = useMemo(() => {
    const q = search.toLowerCase();
    return businesses.filter(b => {
      const matchSearch = b.business_name.toLowerCase().includes(q) ||
        (b.industry || '').toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q);
      const matchChip = activeChip === 'All' || b.industry === activeChip;
      return matchSearch && matchChip;
    });
  }, [businesses, search, activeChip]);

  const filteredProfessions = useMemo(() => {
    const q = search.toLowerCase();
    return professions.filter(p => {
      const matchSearch = p.profession_type.toLowerCase().includes(q) ||
        (p.specialisation || '').toLowerCase().includes(q) ||
        (p.employer || '').toLowerCase().includes(q);
      const matchChip = activeChip === 'All' || p.profession_type === activeChip;
      return matchSearch && matchChip;
    });
  }, [professions, search, activeChip]);

  if (!_hydrated) return null;

  // Gate: not logged in
  if (!token) {
    return (
      <div className="min-h-screen transition-colors flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <Lock size={48} className="text-dark/20 dark:text-white/20 mx-auto mb-4" />
          <h1 className="font-display text-4xl text-dark dark:text-white mb-3">
            Members Only
          </h1>
          <p className="text-dark/50 dark:text-white/50 mb-6">
            Login with your member account to access the directory, browse businesses, and connect with fellow Rotaractors.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/login"
              className="px-6 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-colors">
              Login
            </Link>
            <Link href="/join"
              className="px-6 py-3 border border-black/10 dark:border-white/10 text-dark dark:text-white rounded-xl font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              Connect with fellow Rotaractors — explore businesses, professions, and grow together.
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
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all flex-1 justify-center whitespace-nowrap ${
                  tab === t.key
                    ? 'bg-accent text-white shadow-md'
                    : 'text-dark/50 dark:text-white/50 hover:text-dark dark:hover:text-white'
                }`}>
                <t.icon size={16} />
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
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
              onChange={e => setSearch(e.target.value)}
              placeholder="Search members, businesses, professions..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-dark dark:text-white placeholder-dark/30 dark:placeholder-white/30 focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          {/* Filter Chips */}
          {tab === 'business' && businessChips.length > 1 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {businessChips.map(chip => (
                <button key={chip} onClick={() => setActiveChip(chip)}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                    activeChip === chip
                      ? 'bg-accent text-white'
                      : 'bg-black/5 dark:bg-white/5 text-dark/50 dark:text-white/50 border border-black/10 dark:border-white/10 hover:border-accent/50'
                  }`}>
                  {chip}
                </button>
              ))}
            </div>
          )}
          {tab === 'professions' && professionChips.length > 1 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {professionChips.map(chip => (
                <button key={chip} onClick={() => setActiveChip(chip)}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                    activeChip === chip
                      ? 'bg-accent text-white'
                      : 'bg-black/5 dark:bg-white/5 text-dark/50 dark:text-white/50 border border-black/10 dark:border-white/10 hover:border-accent/50'
                  }`}>
                  {chip}
                </button>
              ))}
            </div>
          )}

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
                {filteredMembers.map((m, i) => {
                  const initials = m.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  const vis = m.member_visibility?.[0];
                  const primaryProf = m.professions?.find(p => p.is_primary) || m.professions?.[0];
                  const primaryBiz = m.businesses?.[0];

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
                        {vis?.show_profession && primaryProf && (
                          <p className="text-dark/50 dark:text-white/50 text-sm mb-1">
                            {primaryProf.profession_type}{primaryProf.employer ? ` at ${primaryProf.employer}` : ''}
                          </p>
                        )}
                        {vis?.show_business_name && primaryBiz && (
                          <p className="text-dark/40 dark:text-white/40 text-xs mb-2">{primaryBiz.business_name}</p>
                        )}
                        <div className="mt-auto pt-3">
                          <button onClick={() => setConnectModal({
                            full_name: m.full_name,
                            avatar_url: m.avatar_url,
                            profession_type: primaryProf?.profession_type,
                            employer: primaryProf?.employer,
                            show_contact: vis?.show_contact,
                          })}
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
                {filteredBusinesses.map((b, i) => {
                  const ownerName = b.members?.full_name || 'Unknown';
                  const ownerAvatar = b.members?.avatar_url;
                  const ownerInitials = ownerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <AnimatedSection key={b.business_id} delay={i * 80} from={i % 2 === 0 ? 'left' : 'right'}>
                      <div className="rounded-2xl bg-light-card dark:bg-dark-card border border-black/5 dark:border-white/5 overflow-hidden hover:shadow-lg hover:shadow-accent/5 transition-all duration-300">
                        {/* Gradient header */}
                        <div className="h-24 bg-gradient-to-r from-accent to-accent-light relative">
                          <div className="absolute inset-0 bg-black/20" />
                          {b.industry && (
                            <span className="absolute bottom-3 left-4 px-3 py-1 text-xs bg-black/30 backdrop-blur-sm text-white rounded-full">
                              {b.industry}
                            </span>
                          )}
                        </div>
                        <div className="p-5">
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
                            <p className="text-dark/50 dark:text-white/50 text-sm line-clamp-2 mb-3">{b.description}</p>
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
                          <button onClick={() => setConnectModal({
                            full_name: ownerName,
                            avatar_url: ownerAvatar,
                            profession_type: b.designation,
                            employer: b.business_name,
                          })}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-light transition-colors">
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

          {/* Professions Tab */}
          {!loading && tab === 'professions' && (
            filteredProfessions.length === 0 ? <EmptyState /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProfessions.map((p, i) => {
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
                          <button onClick={() => setConnectModal({
                            full_name: ownerName,
                            avatar_url: ownerAvatar,
                            profession_type: p.profession_type,
                            employer: p.employer,
                          })}
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
