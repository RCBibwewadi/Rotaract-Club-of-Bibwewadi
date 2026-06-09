'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';
import { useAuthStore } from '@/lib/auth-store';
import {
  User, Mail, Phone, Calendar, Briefcase, Building2, GraduationCap,
  MapPin, Globe, LogOut, Lock, Star,
} from 'lucide-react';

export default function ProfilePage() {
  const { member, token, _hydrated, logout, fetchProfile } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hydrated && token && !member) {
      fetchProfile();
    }
  }, [_hydrated, token, member, fetchProfile]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!_hydrated) return null;

  if (!token) {
    return (
      <div className="min-h-screen bg-light dark:bg-dark transition-colors flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <Lock size={48} className="text-dark/20 dark:text-white/20 mx-auto mb-4" />
          <h1 className="font-[Instrument_Serif] text-4xl text-dark dark:text-white mb-3">
            Not Logged In
          </h1>
          <p className="text-dark/50 dark:text-white/50 mb-6">
            Login to view your member profile.
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

  if (!member) {
    return (
      <div className="min-h-screen bg-light dark:bg-dark transition-colors flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark/50 dark:text-white/50">Loading profile...</p>
        </div>
      </div>
    );
  }

  const initials = member.full_name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-light dark:bg-dark transition-colors">
      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-12 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={member.full_name}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-accent/20" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-2xl font-bold">
                  {initials}
                </div>
              )}
              <div className="text-center sm:text-left">
                <h1 className="font-[Instrument_Serif] text-4xl md:text-5xl text-dark dark:text-white mb-1">
                  {member.full_name}
                </h1>
                <p className="text-dark/50 dark:text-white/50">@{member.username}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-3 py-1 text-xs rounded-full bg-accent/10 text-accent font-medium">
                    {member.member_type.replace('_', ' ')}
                  </span>
                  {member.years_in_rcb !== undefined && member.years_in_rcb > 0 && (
                    <span className="px-3 py-1 text-xs rounded-full bg-black/5 dark:bg-white/5 text-dark/60 dark:text-white/60">
                      {member.years_in_rcb} year{member.years_in_rcb > 1 ? 's' : ''} in RCB
                    </span>
                  )}
                </div>
              </div>
              <button onClick={handleLogout}
                className="sm:ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors text-sm font-medium">
                <LogOut size={16} /> Logout
              </button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Details */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Personal Info */}
          <AnimatedSection delay={100}>
            <div className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              <h2 className="text-dark dark:text-white font-semibold mb-4 flex items-center gap-2">
                <User size={18} className="text-accent" /> Personal Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={Mail} label="Email" value={member.email} />
                {member.phone && <InfoRow icon={Phone} label="Phone" value={member.phone} />}
                {member.dob && <InfoRow icon={Calendar} label="Date of Birth" value={member.dob} />}
                {member.interests && <InfoRow icon={Star} label="Interests" value={member.interests} />}
                {member.rid && <InfoRow icon={User} label="Rotary ID" value={member.rid} />}
              </div>
            </div>
          </AnimatedSection>

          {/* Businesses */}
          {member.businesses && member.businesses.length > 0 && (
            <AnimatedSection delay={200}>
              <div className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                <h2 className="text-dark dark:text-white font-semibold mb-4 flex items-center gap-2">
                  <Building2 size={18} className="text-accent" /> Business
                </h2>
                <div className="space-y-4">
                  {member.businesses.map(b => (
                    <div key={b.business_id} className="p-4 rounded-xl bg-black/5 dark:bg-white/5">
                      <h3 className="text-dark dark:text-white font-medium text-lg">{b.business_name}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {b.industry && <InfoRow icon={Briefcase} label="Industry" value={b.industry} />}
                        {b.designation && <InfoRow icon={User} label="Designation" value={b.designation} />}
                        {b.business_city && <InfoRow icon={MapPin} label="City" value={b.business_city} />}
                        {b.website_url && <InfoRow icon={Globe} label="Website" value={b.website_url} />}
                      </div>
                      {b.description && (
                        <p className="text-dark/50 dark:text-white/50 text-sm mt-2">{b.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* Professions */}
          {member.professions && member.professions.length > 0 && (
            <AnimatedSection delay={300}>
              <div className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                <h2 className="text-dark dark:text-white font-semibold mb-4 flex items-center gap-2">
                  <GraduationCap size={18} className="text-accent" /> Professions
                </h2>
                <div className="space-y-4">
                  {member.professions.map(p => (
                    <div key={p.profession_id} className="p-4 rounded-xl bg-black/5 dark:bg-white/5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-dark dark:text-white font-medium">{p.profession_type}</h3>
                        {p.is_primary && (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-accent/10 text-accent font-medium">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {p.specialisation && <InfoRow icon={Star} label="Specialisation" value={p.specialisation} />}
                        {p.years_experience && <InfoRow icon={Calendar} label="Experience" value={p.years_experience} />}
                        {p.employer && <InfoRow icon={Building2} label="Employer" value={p.employer} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          )}
        </div>
      </section>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-accent/60 flex-shrink-0" />
      <span className="text-dark/40 dark:text-white/40 text-sm">{label}:</span>
      <span className="text-dark dark:text-white text-sm truncate">{value}</span>
    </div>
  );
}
